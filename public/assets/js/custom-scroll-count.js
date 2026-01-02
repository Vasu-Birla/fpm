/*==========

Theme Name: Lawace - Attorney & Lawyers HTML Template
Theme Version: 1.0

==========*/

/*==========
----- JS INDEX -----
1.Whole Script Strict Mode Syntax
2.Counting JS
==========*/

$(document).ready(function ($) {
	// Whole Script Strict Mode Syntax
	"use strict";

	// Counting JS Start
	var observer = new IntersectionObserver(
		function (entries, observer) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					// Start counting when the element is in the viewport
					var $this = $(entry.target),
						countTo = $this.attr("data-count");

					$({ countNum: $this.text() }).animate(
						{
							countNum: countTo
						},
						{
							duration: 2000,
							easing: "linear",
							step: function () {
								$this.text(Math.floor(this.countNum));
							},
							complete: function () {
								$this.text(this.countNum);
							}
						}
					);

					observer.unobserve(entry.target); // Unobserve once counting starts
				}
			});
		},
		{ threshold: 0.1 }
	); // Adjust threshold if needed (0.1 means 10% of the element needs to be visible)

	// Attach the observer to all elements with class .counting
	$(".counting").each(function () {
		observer.observe(this);
	});

	// Separate observer for progress bars
	var progressBarObserver = new IntersectionObserver(
		function (entries, observer) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					$(entry.target)
						.find(".experience-skill-bar-inner")
						.animate(
							{
								width: $(entry.target).attr("data-width")
							},
							2000
						);
					observer.unobserve(entry.target); // Unobserve once animation starts
				}
			});
		},
		{ threshold: 0.1 }
	);

	// Attach the observer to all progress bars
	$(".experience-skill-bar").each(function () {
		progressBarObserver.observe(this);
	});

	// Counting JS End
});
