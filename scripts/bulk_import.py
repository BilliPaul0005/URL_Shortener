"""
Bulk URL Import Script
Reads URLs from a CSV file and sends them to the shorten API in batches.
Writes the resulting slug mappings to an output CSV.

Usage:
  python scripts/bulk_import.py input.csv output.csv
  python scripts/bulk_import.py input.csv              # defaults to output.csv

Input CSV must have a header row with a column named 'url'.
"""

import csv
import sys
import time
import requests

API_URL = "http://localhost:3000/api/shorten"
BATCH_SIZE = 10


def shorten_url(url: str) -> dict:
    """Send a single URL to the shorten endpoint."""
    resp = requests.post(API_URL, json={"url": url}, timeout=10)
    resp.raise_for_status()
    return resp.json()


def main():
    if len(sys.argv) < 2:
        print("Usage: python bulk_import.py <input.csv> [output.csv]")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else "output.csv"

    # Read input URLs
    with open(input_file, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        urls = [row["url"].strip() for row in reader if row.get("url")]

    print(f"📄 Read {len(urls)} URLs from {input_file}")

    results = []
    for i in range(0, len(urls), BATCH_SIZE):
        batch = urls[i : i + BATCH_SIZE]
        print(f"  Batch {i // BATCH_SIZE + 1}: processing {len(batch)} URLs...")

        for url in batch:
            try:
                data = shorten_url(url)
                results.append(
                    {
                        "original_url": data["original_url"],
                        "short_url": data["short_url"],
                        "slug": data["slug"],
                    }
                )
            except Exception as e:
                print(f"  ⚠ Failed to shorten {url}: {e}")
                results.append(
                    {"original_url": url, "short_url": "ERROR", "slug": "ERROR"}
                )

        # Brief pause between batches to respect rate limits
        if i + BATCH_SIZE < len(urls):
            time.sleep(0.5)

    # Write output CSV
    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["original_url", "short_url", "slug"])
        writer.writeheader()
        writer.writerows(results)

    print(f"✅ Done! Results written to {output_file}")


if __name__ == "__main__":
    main()
