"use strict";

class Cursor {
  constructor(options = {}) {
    this.options = $.extend(
      true,
      {
        container: "body",
        speed: 0.7,
        ease: "expo.out",
        visibleTimeout: 300,
      },
      options,
    );

    this.body = $(this.options.container);

    this.el = $('<div class="cb-cursor"></div>');

    this.text = $('<div class="cb-cursor-text"></div>');

    this.visible = false;

    this.stick = false;

    this.pos = {
      x: 0,
      y: 0,
    };

    this.init();
  }

  init() {
    this.el.append(this.text);

    this.body.append(this.el);

    this.bind();

    this.move(-100, -100, 0);
  }

  bind() {
    const self = this;

    this.body
      .on("mouseleave", function () {
        self.hide();
      })
      .on("mouseenter", function () {
        self.show();
      })
      .on("mousemove", (e) => {
        this.pos = {
          x: this.stick
            ? this.stick.x - (this.stick.x - e.clientX) * 0.15
            : e.clientX,

          y: this.stick
            ? this.stick.y - (this.stick.y - e.clientY) * 0.15
            : e.clientY,
        };

        this.update();
      })
      .on("mousedown", function () {
        self.setState("-active");
      })
      .on("mouseup", function () {
        self.removeState("-active");
      })
      .on("mouseenter", "a,input,textarea,button", function () {
        self.setState("-pointer");
      })
      .on("mouseleave", "a,input,textarea,button", function () {
        self.removeState("-pointer");
      })
      .on("mouseenter", "iframe", function () {
        self.hide();
      })
      .on("mouseleave", "iframe", function () {
        self.show();
      })
      .on("mouseenter", "[data-cursor]", function () {
        self.setState(this.dataset.cursor);
      })
      .on("mouseleave", "[data-cursor]", function () {
        self.removeState(this.dataset.cursor);
      })
      .on("mouseenter", "[data-cursor-text]", function () {
        self.setText(this.dataset.cursorText);
      })
      .on("mouseleave", "[data-cursor-text]", function () {
        self.removeText();
      })
      .on("mouseenter", "[data-cursor-stick]", function () {
        self.setStick(this.dataset.cursorStick);
      })
      .on("mouseleave", "[data-cursor-stick]", function () {
        self.removeStick();
      });
  }

  setState(state) {
    this.el.addClass(state);
  }

  removeState(state) {
    this.el.removeClass(state);
  }

  toggleState(state) {
    this.el.toggleClass(state);
  }

  setText(text) {
    this.text.html(text);
    this.el.addClass("-text");
  }

  removeText() {
    this.el.removeClass("-text");
  }

  setStick(selector) {
    const target = $(selector);

    if (!target.length) {
      return;
    }

    const bound = target.get(0).getBoundingClientRect();

    this.stick = {
      x: bound.left + target.width() / 2,
      y: bound.top + target.height() / 2,
    };

    this.move(this.stick.x, this.stick.y, 0.5);
  }

  removeStick() {
    this.stick = false;
  }

  update() {
    this.move();
    this.show();
  }

  move(x, y, duration) {
    gsap.to(this.el, {
      x: x ?? this.pos.x,
      y: y ?? this.pos.y,
      force3D: true,
      overwrite: true,
      ease: this.options.ease,
      duration: this.visible ? duration || this.options.speed : 0,
    });
  }

  show() {
    if (this.visible) {
      return;
    }

    clearTimeout(this.visibleInt);

    this.el.addClass("-visible");

    this.visibleInt = setTimeout(() => {
      this.visible = true;
    }, 20);
  }

  hide() {
    clearTimeout(this.visibleInt);

    this.el.removeClass("-visible");

    this.visibleInt = setTimeout(() => {
      this.visible = false;
    }, this.options.visibleTimeout);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.cursor = new Cursor();
});
