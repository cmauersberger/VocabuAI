using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace VocabuAI.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddFlashCardLearningState : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FlashCardLearningState",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FlashCardId = table.Column<int>(type: "integer", nullable: false),
                    Box = table.Column<int>(type: "integer", nullable: false),
                    ProgressPointsInCurrentBox = table.Column<int>(type: "integer", nullable: false),
                    CorrectCountsByQuestionTypeInCurrentBox = table.Column<string>(type: "jsonb", nullable: false),
                    CorrectCountTotal = table.Column<int>(type: "integer", nullable: false),
                    WrongCountTotal = table.Column<int>(type: "integer", nullable: false),
                    CorrectStreak = table.Column<int>(type: "integer", nullable: false),
                    LastAnsweredAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateTimeCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DateTimeUpdated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FlashCardLearningState", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FlashCardLearningState_FlashCards_FlashCardId",
                        column: x => x.FlashCardId,
                        principalTable: "FlashCards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.CheckConstraint("CK_FlashCardLearningState_Box_Range", "\"Box\" >= 1 AND \"Box\" <= 5");
                });

            migrationBuilder.CreateIndex(
                name: "IX_FlashCardLearningState_FlashCardId",
                table: "FlashCardLearningState",
                column: "FlashCardId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FlashCardLearningState");
        }
    }
}
