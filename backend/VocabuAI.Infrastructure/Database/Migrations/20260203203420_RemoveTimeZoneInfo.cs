using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VocabuAI.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTimeZoneInfo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UserTimeZone",
                table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UserTimeZone",
                table: "Users",
                type: "text",
                nullable: true);
        }
    }
}
