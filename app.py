
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

POSITIVE_WORDS = [
    "good", "great", "excellent", "amazing", "love",
    "best", "perfect", "happy", "wonderful", "awesome",
    "comfortable", "fast", "beautiful", "useful", "recommend"
]

NEGATIVE_WORDS = [
    "bad", "poor", "worst", "terrible", "hate",
    "broken", "disappointed", "slow", "expensive",
    "waste", "damaged", "problem", "useless", "defective"
]


def analyze_sentiment(review):
    words = review.lower().split()

    positive_score = sum(
        1 for word in words
        if word.strip(".,!?") in POSITIVE_WORDS
    )

    negative_score = sum(
        1 for word in words
        if word.strip(".,!?") in NEGATIVE_WORDS
    )

    if positive_score > negative_score:
        sentiment = "Positive"
        reason = "The review contains positive expressions."

    elif negative_score > positive_score:
        sentiment = "Negative"
        reason = "The review contains negative expressions."

    else:
        sentiment = "Neutral"
        reason = "The review has no clear positive or negative expressions."

    return {
        "review": review,
        "sentiment": sentiment,
        "reason": reason
    }


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return jsonify({"error": "Invalid request."}), 400

        reviews = data.get("reviews")

        if not isinstance(reviews, list) or len(reviews) == 0:
            return jsonify({
                "error": "Please enter at least one review."
            }), 400

        if len(reviews) > 50:
            return jsonify({
                "error": "Maximum 50 reviews allowed."
            }), 400

        if not all(
            isinstance(review, str)
            and review.strip()
            and len(review) <= 2000
            for review in reviews
        ):
            return jsonify({
                "error": "Each review must contain 1–2000 characters."
            }), 400

        reviews = [review.strip() for review in reviews]

        results = [
            analyze_sentiment(review)
            for review in reviews
        ]

        distribution = {
            "Positive": 0,
            "Negative": 0,
            "Neutral": 0
        }

        for result in results:
            distribution[result["sentiment"]] += 1

        return jsonify({
            "success": True,
            "results": results,
            "distribution": distribution,
            "total": len(results)
        })

    except Exception:
        app.logger.exception("Analysis error")
        return jsonify({
            "error": "Something went wrong. Please try again."
        }), 500


if __name__ == "__main__":
    app.run(debug=True)
