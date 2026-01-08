using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocabuAI.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddFlashCardLanguageCodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ForeignLanguageCode",
                table: "FlashCards",
                type: "text",
                nullable: false,
                defaultValue: "en");

            migrationBuilder.AddColumn<string>(
                name: "LocalLanguageCode",
                table: "FlashCards",
                type: "text",
                nullable: false,
                defaultValue: "de");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ForeignLanguageCode",
                table: "FlashCards");

            migrationBuilder.DropColumn(
                name: "LocalLanguageCode",
                table: "FlashCards");
        }
    }
}
