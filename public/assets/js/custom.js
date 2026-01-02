/*==========

Theme Name: Lawace - Attorney & Lawyers HTML Template
Theme Version: 1.0

==========*/

/*==========
----- JS INDEX -----
1.Whole Script Strict Mode Syntax
2.Loader JS
3.Wow Animation JS
4.Smooth Scrolling JS
5.Scroll To Top JS
6.Sticky Header JS
7.Toggle Menu Mobile JS
8.FAQ Accordion JS
9.Case Study Slider JS
10.Clients Slider JS
11.Our Story Slider JS
12.Testimonial Slider JS
13.Team Slider JS
14.Related Member Slider JS
15.Submenu For Mobile JS
16.Social Icon JS
17.Dynamic Date JS
==========*/

$(document).ready(function ($) {
    // Whole Script Strict Mode Syntax
    "use strict";

    $(window).ready(function () {
        // Loader JS Start
        $(".loader-box").fadeOut();
        // Loader JS End
        $("body").removeClass("fixed");
        // Wow Animation JS Start
        new WOW().init();
        // Wow Animation JS Start
    });

    // Smooth Scrolling JS Start
    if (window.location.hash) {
        // smooth scroll to the anchor id
        $("html,body").animate(
            {
                scrollTop: $(window.location.hash).offset().top - 100,
            },
            1000,
            "swing"
        );
    } else {
        setTimeout(function () {
            scroll(0, 0);
        }, 1);
    }
    // Smooth Scrolling JS End

    // Scroll To Top JS Start
    $("#scroll-to-top").on("click", function () {
        $("html, body").animate({ scrollTop: 0 }, 500);
        return false;
    });
    $(window).on("scroll", function () {
        if ($(window).scrollTop() > 300) {
            $("#scroll-to-top").fadeIn(500);
        } else {
            $("#scroll-to-top").fadeOut(500);
        }
    });
    // Scroll To Top JS End

    // Sticky Header JS Start
    $(window).on("scroll", function () {
        if ($(window).scrollTop() >= 100) {
            $(".site-header").addClass("sticky-header");
        } else {
            $(".site-header").removeClass("sticky-header");
        }
    });
    // Sticky Header JS End

    // Toggle Menu Mobile JS Start
    $(".toggle-button").on("click", function () {
        $(".main-navigation").toggleClass("toggle-menu");
        $(".header-menu .black-shadow").fadeToggle();
    });
    $(".main-navigation ul li a").on("click", function () {
        $(".main-navigation").removeClass("toggle-menu");
        $(".header-menu .black-shadow").fadeOut();
    });
    $(".main-navigation ul li.sub-items>a").on("click", function () {
        $(".main-navigation").addClass("toggle-menu");
        $(".header-menu .black-shadow").stop();
    });
    $(".header-menu .black-shadow").on("click", function () {
        $(this).fadeOut();
        $(".main-navigation").removeClass("toggle-menu");
    });
    // Toggle Menu Mobile JS End

    // FAQ Accordion JS Start
    jQuery(".faq-accordion .faq-accordion-content").hide();
    jQuery(".faq-accordion").each(function () {
        jQuery(this).find("> div:eq(0) .faq-accordion-title").addClass("active-faq");
        jQuery(this).find("> div:eq(0) .faq-accordion-content").slideDown();
    });
    jQuery(".faq-accordion-title").click(function (j) {
        var dropDown = jQuery(this).closest(".faq-accordion-box").find(".faq-accordion-content");
        jQuery(this).closest(".faq-accordion").find(".faq-accordion-content").not(dropDown).slideUp();
        if (jQuery(this).hasClass("active-faq")) {
            jQuery(this).removeClass("active-faq");
        } else {
            jQuery(this).closest(".faq-accordion").find(".faq-accordion-title.active-faq").removeClass("active-faq");
            jQuery(this).addClass("active-faq");
        }
        dropDown.stop(false, true).slideToggle();
        j.preventDefault();
    });
    // FAQ Accordion JS End

    // Case Study Slider JS Start
    const case_study_slider = new Swiper(".case-study-slider", {
        slidesPerView: 4,
        loop: true,
        autoplay: {
            delay: 3000,
            disableOnInteraction: false,
        },
        spaceBetween: 0,
        speed: 1500,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        breakpoints: {
            0: {
                slidesPerView: 1,
                direction: "horizontal",
            },
            576: {
                slidesPerView: 2,
            },
            992: {
                slidesPerView: 3,
            },
            1400: {
                slidesPerView: 4,
            },
        },
    });
    $(".case-study-slider").hover(
        function () {
            case_study_slider.autoplay.stop();
        },
        function () {
            case_study_slider.autoplay.start();
        }
    );
    // Case Study Slider JS End

    // Clients Slider JS Start
    const clients_slider = new Swiper(".clients-slider", {
        slidesPerView: 6,
        loop: true,
        autoplay: {
            delay: 2000,
            disableOnInteraction: false,
        },
        spaceBetween: 48,
        speed: 1500,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        breakpoints: {
            0: {
                slidesPerView: 2,
                direction: "horizontal",
                spaceBetween: 20,
            },
            768: {
                slidesPerView: 3,
                spaceBetween: 48,
            },
            992: {
                slidesPerView: 4,
            },
            1200: {
                slidesPerView: 5,
            },
            1400: {
                slidesPerView: 6,
            },
        },
    });
    $(".clients-slider").hover(
        function () {
            clients_slider.autoplay.stop();
        },
        function () {
            clients_slider.autoplay.start();
        }
    );
    // Clients Slider JS End

    // Our Story Slider JS Start
    const our_story_slider = new Swiper(".our-story-slider", {
        slidesPerView: 4,
        loop: false,
        speed: 1500,
        direction: "horizontal",
        effect: "slide",
        navigation: false,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        autoplay: {
            delay: 3000,
            disableOnInteraction: false,
        },
        breakpoints: {
            0: {
                slidesPerView: 1,
            },
            576: {
                slidesPerView: 2,
            },
            992: {
                slidesPerView: 3,
            },
            1200: {
                slidesPerView: 4,
            },
        },
    });
    $(".our-story-slider").hover(
        function () {
            our_story_slider.autoplay.stop();
        },
        function () {
            our_story_slider.autoplay.start();
        }
    );
    // Our Story Slider JS End

    // Testimonial Slider JS Start
    const testimonial_slider = new Swiper(".testimonial-slider", {
        slidesPerView: 2,
        loop: true,
        parallax: true,
        autoplay: {
            delay: 3000,
            disableOnInteraction: false,
        },
        speed: 1500,
        direction: "horizontal",
        effect: "slide",
        spaceBetween: 24,
        navigation: false,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        breakpoints: {
            0: {
                slidesPerView: 1,
            },
            992: {
                slidesPerView: 2,
            },
            1200: {
                slidesPerView: 2,
            },
        },
    });
    $(".testimonial-slider").hover(
        function () {
            testimonial_slider.autoplay.stop();
        },
        function () {
            testimonial_slider.autoplay.start();
        }
    );
    // Testimonial Slider JS End

    // Team Slider JS Start
    const team_slider = new Swiper(".team-slider", {
        slidesPerView: 3,
        loop: true,
        parallax: true,
        autoplay: {
            delay: 3000,
            disableOnInteraction: false,
        },
        speed: 1500,
        direction: "horizontal",
        effect: "slide",
        spaceBetween: 24,
        navigation: false,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        breakpoints: {
            0: {
                slidesPerView: 1,
            },
            576: {
                slidesPerView: 2,
            },
            992: {
                slidesPerView: 3,
                pagination: false,
            },
        },
    });
    $(".team-slider").hover(
        function () {
            team_slider.autoplay.stop();
        },
        function () {
            team_slider.autoplay.start();
        }
    );
    // Team Slider JS End

    // Related Member Slider JS Start
    const related_member_slider = new Swiper(".related-member-slider", {
        slidesPerView: 4,
        loop: true,
        parallax: true,
        autoplay: {
            delay: 3000,
            disableOnInteraction: false,
        },
        speed: 1500,
        direction: "horizontal",
        effect: "slide",
        spaceBetween: 24,
        navigation: false,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        breakpoints: {
            0: {
                slidesPerView: 1,
            },
            576: {
                slidesPerView: 2,
            },
            992: {
                slidesPerView: 3,
            },
            1200: {
                slidesPerView: 4,
            },
        },
    });
    $(".team-slider").hover(
        function () {
            related_member_slider.autoplay.stop();
        },
        function () {
            related_member_slider.autoplay.start();
        }
    );
    // Related Member Slider JS End

    if ($(window).width() < 992) {
        // Submenu For Mobile JS Start
        $("body").on("click", ".main-navigation ul li.sub-items>a", function () {
            if ($(this).parent().hasClass("active-sub-menu")) {
                $(this).parent().removeClass("active-sub-menu");
                $(this).parent().find("ul").slideUp();
            } else {
                $(this).parent().addClass("active-sub-menu");
                $(this).parent().find("ul").slideDown();
            }
        });
        // Submenu For Mobile JS End

        // Social Icon JS Start
        $(".team-social-share").on("click", function () {
            const parentBox = $(this).closest(".team-social");
            $(".team-social").not(parentBox).removeClass("active");
            parentBox.toggleClass("active");
        });
        $(".blog-share-icon").on("click", function () {
            const parentBox2 = $(this).closest(".blog-share-box");
            $(".blog-share-box").not(parentBox2).removeClass("active");
            parentBox2.toggleClass("active");
        });
        // Social Icon JS End
    }
});

// Dynamic Date JS
document.getElementById("copy-right-year").innerHTML = new Date().getFullYear();
