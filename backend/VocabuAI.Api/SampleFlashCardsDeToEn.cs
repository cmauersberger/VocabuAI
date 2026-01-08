namespace VocabuAI.Api;

public sealed record SampleFlashCard(string LocalTerm, string ForeignTerm);

public static class SampleFlashCardsDeToEn
{
    public const string ForeignLanguageCode = "en";
    public const string LocalLanguageCode = "de";

    public static readonly IReadOnlyList<SampleFlashCard> Items = new[]
    {
        new SampleFlashCard("Schadenfreude", "gloating at another's misfortune"),
        new SampleFlashCard("Weltschmerz", "world-weariness"),
        new SampleFlashCard("Fernweh", "longing for faraway places"),
        new SampleFlashCard("Zeitgeist", "spirit of the time"),
        new SampleFlashCard("Fingerspitzengefuehl", "intuitive sensitivity"),
        new SampleFlashCard("Doppelgaenger", "double or look-alike"),
        new SampleFlashCard("Torschlusspanik", "fear of missing the chance"),
        new SampleFlashCard("Vergangenheitsbewaeltigung", "coming to terms with the past"),
        new SampleFlashCard("Sturmfrei", "house to oneself"),
        new SampleFlashCard("Kummerspeck", "weight gained from emotional eating"),
        new SampleFlashCard("Feierabend", "after-work time"),
        new SampleFlashCard("Waldeinsamkeit", "forest solitude"),
        new SampleFlashCard("Fruehjahrsputz", "spring cleaning"),
        new SampleFlashCard("Bauchgefuehl", "gut feeling"),
        new SampleFlashCard("Sitzfleisch", "stamina for sitting tasks"),
        new SampleFlashCard("Zweisamkeit", "intimate togetherness"),
        new SampleFlashCard("Donaudampfschifffahrtsgesellschaftskapitaen", "Danube steamship company captain"),
        new SampleFlashCard("Traeumerei", "daydreaming"),
        new SampleFlashCard("Fremdschaemen", "second-hand embarrassment"),
        new SampleFlashCard("Erklaerungsnot", "need to explain oneself"),
        new SampleFlashCard("Kopfkino", "vivid imagination"),
        new SampleFlashCard("Treppenwitz", "staircase wit"),
        new SampleFlashCard("Handschuhschneeballwerfer", "glove-wearing snowball thrower"),
        new SampleFlashCard("Eierlegendewollmilchsau", "jack-of-all-trades"),
        new SampleFlashCard("Stoerungsdienst", "disruption service"),
        new SampleFlashCard("Sparfuchs", "thrifty person"),
        new SampleFlashCard("Besserwisser", "know-it-all"),
        new SampleFlashCard("Gedankenexperiment", "thought experiment"),
        new SampleFlashCard("Gemuetlichkeit", "cozy comfort"),
        new SampleFlashCard("Schnapsidee", "harebrained idea")
    };
}
