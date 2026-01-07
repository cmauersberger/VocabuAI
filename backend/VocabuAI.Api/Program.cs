using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Npgsql;
using VocabuAI.Application.Learning;
using VocabuAI.Api.Endpoints;
using VocabuAI.Api.Infrastructure;
using VocabuAI.Infrastructure.Database;
using VocabuAI.Infrastructure.Database.Entities;
using VocabuAI.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddJsonFile("appsettings.Development.local.json", optional: true, reloadOnChange: true);
}

var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
if (!string.IsNullOrWhiteSpace(databaseUrl))
{
    builder.Configuration["ConnectionStrings:Postgres"] = BuildConnectionString(databaseUrl);
}

var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET");
if (!string.IsNullOrWhiteSpace(jwtSecret) && string.IsNullOrWhiteSpace(builder.Configuration["Jwt:SigningKey"]))
{
    builder.Configuration["Jwt:SigningKey"] = jwtSecret;
}

var inviteTokenHash = Environment.GetEnvironmentVariable("INVITE_TOKEN_HASH");
if (!string.IsNullOrWhiteSpace(inviteTokenHash))
{
    builder.Configuration["Invite:TokenHash"] = inviteTokenHash;
}

if (!InviteTokenHasher.IsValidHashFormat(builder.Configuration["Invite:TokenHash"]))
{
    throw new InvalidOperationException("Invite token hash is missing or invalid. Set INVITE_TOKEN_HASH to a SHA-256 hex value.");
}

builder.Services.AddOptions<JwtOptions>()
    .Bind(builder.Configuration.GetSection(JwtOptions.SectionName))
    .Validate(o => !string.IsNullOrWhiteSpace(o.Issuer), "Jwt:Issuer is required")
    .Validate(o => !string.IsNullOrWhiteSpace(o.Audience), "Jwt:Audience is required")
    .Validate(o => !string.IsNullOrWhiteSpace(o.SigningKey) && o.SigningKey.Length >= 32, "Jwt:SigningKey must be at least 32 characters")
    .ValidateOnStart();

var connectionString = builder.Configuration.GetConnectionString("Postgres");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("Connection string 'Postgres' is missing. Set ConnectionStrings:Postgres or DATABASE_URL.");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IFlashCardRepository, FlashCardRepository>();
builder.Services.AddScoped<IFlashCardLearningStateRepository, FlashCardLearningStateRepository>();
builder.Services.AddScoped<FlashCardLearningProgressService>();
builder.Services.AddScoped<ILearningSessionService, LearningSessionService>();
builder.Services.AddScoped<IPasswordHasher<UserDb>, PasswordHasher<UserDb>>();

var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
var signingKeyBytes = Encoding.UTF8.GetBytes(jwt.SigningKey);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(signingKeyBytes),
            ClockSkew = TimeSpan.FromMinutes(2)
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("signup", limiterOptions =>
    {
        limiterOptions.PermitLimit = 5;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueLimit = 0;
        limiterOptions.AutoReplenishment = true;
    });
});

builder.Services.AddCors(cors =>
{
    cors.AddDefaultPolicy(policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
        if (origins is { Length: > 0 })
        {
            policy.WithOrigins(origins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
        else
        {
            policy.AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "VocabuAI API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste a JWT token: Bearer {token}"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

app.UseCors();
app.UseRateLimiter();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

// WARNING: Running migrations on startup can block app startup and requires schema-altering permissions.
// Ensure your deployment strategy accounts for zero-downtime compatibility and operational risk.
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();
}

app.MapHealthEndpoints(app.Environment.ApplicationName);
app.MapAuthEndpoints();
app.MapUserEndpoints();
app.MapFlashCardEndpoints();
app.MapLearningSessionEndpoints();

app.Run();

static string BuildConnectionString(string databaseUrl)
{
    if (!Uri.TryCreate(databaseUrl, UriKind.Absolute, out var uri))
    {
        throw new InvalidOperationException("DATABASE_URL is not a valid URI.");
    }

    if (!string.Equals(uri.Scheme, "postgresql", StringComparison.OrdinalIgnoreCase) &&
        !string.Equals(uri.Scheme, "postgres", StringComparison.OrdinalIgnoreCase))
    {
        throw new InvalidOperationException("DATABASE_URL must use the postgresql:// scheme.");
    }

    var userInfo = uri.UserInfo.Split(':', 2, StringSplitOptions.RemoveEmptyEntries);
    if (userInfo.Length != 2)
    {
        throw new InvalidOperationException("DATABASE_URL must include username and password.");
    }

    var databaseName = uri.AbsolutePath.Trim('/');
    if (string.IsNullOrWhiteSpace(databaseName))
    {
        throw new InvalidOperationException("DATABASE_URL must include a database name.");
    }

    var builder = new NpgsqlConnectionStringBuilder
    {
        Host = uri.Host,
        Port = uri.Port > 0 ? uri.Port : 5432,
        Username = Uri.UnescapeDataString(userInfo[0]),
        Password = Uri.UnescapeDataString(userInfo[1]),
        Database = databaseName
    };

    return builder.ConnectionString;
}
