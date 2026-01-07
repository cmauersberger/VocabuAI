FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY backend/VocabuAI.sln backend/
COPY backend/VocabuAI.Api/VocabuAI.Api.csproj backend/VocabuAI.Api/
COPY backend/VocabuAI.Application/VocabuAI.Application.csproj backend/VocabuAI.Application/
COPY backend/VocabuAI.Domain/VocabuAI.Domain.csproj backend/VocabuAI.Domain/
COPY backend/VocabuAI.Infrastructure/VocabuAI.Infrastructure.csproj backend/VocabuAI.Infrastructure/
RUN dotnet restore backend/VocabuAI.sln

COPY backend/ backend/
RUN dotnet publish backend/VocabuAI.Api/VocabuAI.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 5080
ENV ASPNETCORE_URLS=http://0.0.0.0:5080
ENTRYPOINT ["dotnet", "VocabuAI.Api.dll"]
