using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocabuAI.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddUserDefaultFlashCardLanguages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DefaultForeignFlashCardLanguage",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "en");

            migrationBuilder.AddColumn<string>(
                name: "DefaultLocalFlashCardLanguage",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "de");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DefaultForeignFlashCardLanguage",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DefaultLocalFlashCardLanguage",
                table: "Users");
        }
    }
}
