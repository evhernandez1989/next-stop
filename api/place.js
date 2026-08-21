// Vercel serverless function — on-demand rich details for ONE place.
// Called only when a user taps "More info", so the pricier review/atmosphere
// data isn't fetched for every restaurant in the list.

export default async function handler(req, res) {
  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) return res.status(500).json({ error: "Server missing GOOGLE_PLACES_KEY" });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing place id." });

  try {
    const fields = [
      "id",
      "displayName",
      "formattedAddress",
      "rating",
      "userRatingCount",
      "priceLevel",
      "nationalPhoneNumber",
      "internationalPhoneNumber",
      "websiteUri",
      "googleMapsUri",
      "editorialSummary",
      "currentOpeningHours",
      "reviews",
    ].join(",");

    const resp = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`, {
      headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": fields },
    });
    const data = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({ error: (data.error && data.error.message) || "Details request failed" });
    }

    const reviews = (data.reviews || []).slice(0, 5).map((r) => ({
      author: (r.authorAttribution && r.authorAttribution.displayName) || "Google user",
      rating: r.rating || null,
      text: (r.text && r.text.text) || (r.originalText && r.originalText.text) || "",
      when: r.relativePublishTimeDescription || "",
    }));

    const out = {
      name: (data.displayName && data.displayName.text) || "",
      address: data.formattedAddress || "",
      rating: data.rating || 0,
      ratingCount: data.userRatingCount || 0,
      summary: (data.editorialSummary && data.editorialSummary.text) || "",
      website: data.websiteUri || "",
      googleMapsUri: data.googleMapsUri || "",
      phone: data.internationalPhoneNumber || data.nationalPhoneNumber || "",
      openNow: data.currentOpeningHours ? data.currentOpeningHours.openNow : null,
      hours: (data.currentOpeningHours && data.currentOpeningHours.weekdayDescriptions) || [],
      reviews,
    };

    // Details change slowly — cache an hour at the edge.
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json(out);
  } catch (e) {
    return res.status(500).json({ error: "Unexpected error fetching details." });
  }
}
