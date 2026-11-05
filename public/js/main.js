(function ($) {
  "use strict";

  var $window = $(window);
  var $body = $("body");

  /* =========================================================
     PRELOADER EFFECT
  ========================================================= */

  $window.on("load", function () {
    $(".preloader").fadeOut(600);
  });

  /* =========================================================
     STICKY HEADER
  ========================================================= */

  if ($(".active-sticky-header").length) {
    $window.on("resize", function () {
      setHeaderHeight();
    });

    function setHeaderHeight() {
      $("header.main-header").css(
        "height",
        $("header .header-sticky").outerHeight(),
      );
    }

    $(window).on("scroll", function () {
      var fromTop = $(window).scrollTop();

      setHeaderHeight();

      var headerHeight = $("header .header-sticky").outerHeight();

      $("header .header-sticky").toggleClass(
        "hide",
        fromTop > headerHeight + 100,
      );

      $("header .header-sticky").toggleClass("active", fromTop > 600);
    });
  }

  /* =========================================================
     SLICK MOBILE MENU
  ========================================================= */

  $("#menu").slicknav({
    label: "",
    prependTo: ".responsive-menu",
  });

  /* =========================================================
     BACK TO TOP
  ========================================================= */

  if ($("a[href='#top']").length) {
    $("a[href='#top']").click(function () {
      $("html, body").animate(
        {
          scrollTop: 0,
        },
        "slow",
      );

      return false;
    });
  }

  /* =========================================================
     HERO SLIDER
  ========================================================= */

  if ($(".hero-slider-layout .swiper").length) {
    new Swiper(".hero-slider-layout .swiper", {
      slidesPerView: 1,

      speed: 1000,

      spaceBetween: 0,

      loop: true,

      autoplay: {
        delay: 4000,
      },

      pagination: {
        el: ".hero-pagination",
        clickable: true,
      },
    });
  }

  /* =========================================================
     TESTIMONIAL SLIDER
  ========================================================= */

  if ($(".testimonial-slider .swiper").length) {
    new Swiper(".testimonial-slider .swiper", {
      slidesPerView: 1,

      speed: 1000,

      spaceBetween: 60,

      loop: true,

      autoplay: {
        delay: 5000,
      },

      pagination: {
        el: ".testimonial-pagination",
        clickable: true,
      },

      navigation: {
        nextEl: ".testimonial-button-next",
        prevEl: ".testimonial-button-prev",
      },

      breakpoints: {
        768: {
          slidesPerView: 1,
        },

        991: {
          slidesPerView: 1,
        },
      },
    });
  }

  /* =========================================================
     FAQ CLIENT SLIDER
  ========================================================= */

  if ($(".faqs-client-slider .swiper").length) {
    new Swiper(".faqs-client-slider .swiper", {
      slidesPerView: 2,

      speed: 1000,

      spaceBetween: 40,

      loop: true,

      autoplay: {
        delay: 5000,
      },

      pagination: {
        el: ".testimonial-pagination",
        clickable: true,
      },

      navigation: {
        nextEl: ".testimonial-button-next",
        prevEl: ".testimonial-button-prev",
      },

      breakpoints: {
        768: {
          slidesPerView: 3,
        },

        991: {
          slidesPerView: 5,
        },
      },
    });
  }

  /* =========================================================
     SKILL BAR
  ========================================================= */

  if ($(".skills-progress-bar").length) {
    $(".skills-progress-bar").waypoint(
      function () {
        $(".skillbar").each(function () {
          $(this)
            .find(".count-bar")
            .animate(
              {
                width: $(this).attr("data-percent"),
              },
              2000,
            );
        });
      },
      {
        offset: "50%",
      },
    );
  }

  /* =========================================================
     YOUTUBE BACKGROUND VIDEO
  ========================================================= */

  if ($("#herovideo").length) {
    $("#herovideo").YTPlayer();
  }

  /* =========================================================
     NUMBER COUNTER
     Example:
     <span class="counter">912</span>k+
  ========================================================= */

  const counterElements = document.querySelectorAll(".counter");

  if (counterElements.length) {
    const animateCounter = function (element) {
      /*
       * Prevent the same counter from
       * running more than once.
       */

      if (element.dataset.counted === "true") {
        return;
      }

      /*
       * Read the target BEFORE changing
       * the visible number to zero.
       */

      const rawTarget =
        element.dataset.target || element.textContent.replace(/,/g, "").trim();

      const target = Number(rawTarget);

      if (!Number.isFinite(target)) {
        return;
      }

      /*
       * Remember the final value.
       */

      element.dataset.target = String(target);

      element.dataset.counted = "true";

      /*
       * Start at zero.
       */

      element.textContent = "0";

      const duration = 2200;

      const startTime = performance.now();

      const updateCounter = function (currentTime) {
        const elapsed = currentTime - startTime;

        const progress = Math.min(elapsed / duration, 1);

        /*
         * Ease-out cubic.
         *
         * Starts quickly and slows
         * toward the target.
         */

        const easedProgress = 1 - Math.pow(1 - progress, 3);

        const currentValue = Math.floor(target * easedProgress);

        element.textContent = currentValue.toLocaleString();

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          /*
           * Always finish exactly on
           * the original target.
           */

          element.textContent = target.toLocaleString();
        }
      };

      requestAnimationFrame(updateCounter);
    };

    /*
     * Animate counters when they
     * become visible.
     */

    if ("IntersectionObserver" in window) {
      const counterObserver = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCounter(entry.target);

              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.2,

          rootMargin: "0px 0px -40px 0px",
        },
      );

      counterElements.forEach(function (counter) {
        counterObserver.observe(counter);
      });
    } else {
      /*
       * Fallback for browsers without
       * IntersectionObserver.
       */

      counterElements.forEach(function (counter) {
        animateCounter(counter);
      });
    }
  }

  /* =========================================================
     IMAGE REVEAL ANIMATION
  ========================================================= */

  if ($(".reveal").length) {
    gsap.registerPlugin(ScrollTrigger);

    let revealContainers = document.querySelectorAll(".reveal");

    revealContainers.forEach((container) => {
      let image = container.querySelector("img");

      if (!image) {
        return;
      }

      let tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          toggleActions: "play none none none",
        },
      });

      tl.set(container, {
        autoAlpha: 1,
      });

      tl.from(container, 1, {
        xPercent: -100,

        ease: Power2.out,
      });

      tl.from(image, 1, {
        xPercent: 100,

        scale: 1,

        delay: -1,

        ease: Power2.out,
      });
    });
  }

  /* =========================================================
     TEXT ANIMATION STYLE 1
  ========================================================= */

  if ($(".text-anime-style-1").length) {
    let staggerAmount = 0.05;

    let translateXValue = 0;

    let delayValue = 0.5;

    let animatedTextElements = document.querySelectorAll(".text-anime-style-1");

    animatedTextElements.forEach((element) => {
      let animationSplitText = new SplitText(element, {
        type: "chars, words",
      });

      gsap.from(animationSplitText.words, {
        duration: 1,

        delay: delayValue,

        x: 20,

        autoAlpha: 0,

        stagger: staggerAmount,

        scrollTrigger: {
          trigger: element,

          start: "top 85%",
        },
      });
    });
  }

  /* =========================================================
     TEXT ANIMATION STYLE 2
  ========================================================= */

  if ($(".text-anime-style-2").length) {
    let staggerAmount = 0.03;

    let translateXValue = 20;

    let delayValue = 0.1;

    let easeType = "power2.out";

    let animatedTextElements = document.querySelectorAll(".text-anime-style-2");

    animatedTextElements.forEach((element) => {
      let animationSplitText = new SplitText(element, {
        type: "chars, words",
      });

      gsap.from(animationSplitText.chars, {
        duration: 1,

        delay: delayValue,

        x: translateXValue,

        autoAlpha: 0,

        stagger: staggerAmount,

        ease: easeType,

        scrollTrigger: {
          trigger: element,

          start: "top 85%",
        },
      });
    });
  }

  /* =========================================================
     TEXT ANIMATION STYLE 3
  ========================================================= */

  if ($(".text-anime-style-3").length) {
    let animatedTextElements = document.querySelectorAll(".text-anime-style-3");

    animatedTextElements.forEach((element) => {
      /*
       * Reset previous animation
       * if necessary.
       */

      if (element.animation && element.split) {
        element.animation.progress(1).kill();

        element.split.revert();
      }

      element.split = new SplitText(element, {
        type: "lines,words,chars",

        linesClass: "split-line",
      });

      gsap.set(element, {
        perspective: 400,
      });

      gsap.set(element.split.chars, {
        opacity: 0,

        x: "50",
      });

      element.animation = gsap.to(element.split.chars, {
        scrollTrigger: {
          trigger: element,

          start: "top 90%",
        },

        x: "0",

        y: "0",

        rotateX: "0",

        opacity: 1,

        duration: 1,

        ease: Back.easeOut,

        stagger: 0.02,
      });
    });
  }

  /* =========================================================
     PARALLAX
  ========================================================= */

  var $parallaxie = $(".parallaxie");

  if ($parallaxie.length && $window.width() > 991) {
    if ($window.width() > 768) {
      $parallaxie.parallaxie({
        speed: 0.55,
        offset: 0,
      });
    }
  }

  /* =========================================================
     IMAGE GALLERY
  ========================================================= */

  if ($(".gallery-items").length) {
    $(".gallery-items").magnificPopup({
      delegate: "a",

      type: "image",

      closeOnContentClick: false,

      closeBtnInside: false,

      mainClass: "mfp-with-zoom",

      image: {
        verticalFit: true,
      },

      gallery: {
        enabled: true,
      },

      zoom: {
        enabled: true,

        duration: 300,

        opener: function (element) {
          return element.find("img");
        },
      },
    });
  }

  /* =========================================================
     CONTACT FORM VALIDATION
  ========================================================= */

  var $contactform = $("#contactForm");

  if ($contactform.length && typeof $contactform.validator === "function") {
    $contactform
      .validator({
        focus: false,
      })
      .on("submit", function (event) {
        /*
         * Allow the form's normal
         * server POST unless you
         * explicitly use the old
         * PHP AJAX handler.
         *
         * Your current Node/Express
         * Contact page posts to
         * /contact.
         */

        if ($contactform.attr("action") === "form-process.php") {
          if (!event.isDefaultPrevented()) {
            event.preventDefault();

            submitForm();
          }
        }
      });
  }

  function submitForm() {
    $.ajax({
      type: "POST",

      url: "form-process.php",

      data: $contactform.serialize(),

      success: function (text) {
        if (text === "success") {
          formSuccess();
        } else {
          submitMSG(false, text);
        }
      },
    });
  }

  function formSuccess() {
    if ($contactform.length) {
      $contactform[0].reset();
    }

    submitMSG(true, "Message Sent Successfully!");
  }

  function submitMSG(valid, msg) {
    var msgClasses = valid ? "h4 text-success" : "h4 text-danger";

    $("#msgSubmit").removeClass().addClass(msgClasses).text(msg);
  }

  /* =========================================================
     PROJECT FILTERING
  ========================================================= */

  $window.on("load", function () {
    if ($(".project-item-boxes").length) {
      var $menuitem = $(".project-item-boxes").isotope({
        itemSelector: ".project-item-box",

        layoutMode: "masonry",

        masonry: {
          columnWidth: 1,
        },
      });

      var $menudisesnav = $(".project-nav li a");

      $menudisesnav.on("click", function (e) {
        var filterValue = $(this).attr("data-filter");

        $menuitem.isotope({
          filter: filterValue,
        });

        $menudisesnav.removeClass("active-btn");

        $(this).addClass("active-btn");

        e.preventDefault();
      });

      $menuitem.isotope({
        filter: "*",
      });
    }
  });

  /* =========================================================
     WOW ANIMATIONS
  ========================================================= */

  if (typeof WOW !== "undefined") {
    new WOW().init();
  }

  /* =========================================================
     POPUP VIDEO
  ========================================================= */

  if ($(".popup-video").length) {
    $(".popup-video").magnificPopup({
      type: "iframe",

      mainClass: "mfp-fade",

      removalDelay: 160,

      preloader: false,

      fixedContentPos: true,
    });
  }
})(jQuery);
