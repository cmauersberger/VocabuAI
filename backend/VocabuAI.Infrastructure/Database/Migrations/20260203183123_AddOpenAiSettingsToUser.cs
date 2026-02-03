using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocabuAI.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddOpenAiSettingsToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LastSelectedAiProvider",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "ollama");

            migrationBuilder.AddColumn<string>(
                name: "OpenAiApiKeyEncrypted",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OpenAiMonthlyTokenLimit",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "OpenAiTokensUsedMonthKey",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "OpenAiTokensUsedThisMonth",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "UserTimeZone",
                table: "Users",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastSelectedAiProvider",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "OpenAiApiKeyEncrypted",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "OpenAiMonthlyTokenLimit",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "OpenAiTokensUsedMonthKey",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "OpenAiTokensUsedThisMonth",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "UserTimeZone",
                table: "Users");
        }
    }
}
