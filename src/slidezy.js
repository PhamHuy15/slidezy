function Slidezy(selector, options = {}) {
    this.container = document.querySelector(selector);
    if (!this.container) {
        console.error(`Slidezy: Container "${selector}" not found`);
        return;
    }

    this.otp = Object.assign(
        {
            items: 1,
            speed: 300,
            loop: false,
            nav: true,
            controls: true,
            controlText: ['<', '>'],
            prevButton: null,
            nextButton: null,
            slideBy: 1,
            autoPlay: false,
            autoPlayTimeout: 3000,
            autoPlayHoverPause: true,
        },
        options,
    );
    this.slides = Array.from(this.container.children);
    this.currentIndex = this.otp.loop ? this.otp.items : 0;

    this._init();
    this._updatePosition();
}

Slidezy.prototype._init = function () {
    this.container.classList.add('slidezy-wrapper');

    this._createContent();
    this._createTrack();

    if (this.otp.controls) {
        this._createControl();
    }

    this._createNav();

    if (this.otp.autoPlay) {
        this._startAutoPlay();

        if (this.otp.autoPlayHoverPause) {
            this.container.onmouseenter = () => this._stopAutoPlay();
            this.container.onmouseleave = () => this._startAutoPlay();
        }
    }
};

Slidezy.prototype._startAutoPlay = function () {
    if (this.autoPlayTimer) return;

    const slideBy = this.otp.slideBy;

    this.autoPlayTimer = setInterval(() => {
        this.moveSlide(slideBy);
    }, this.otp.autoPlayTimeout);
};

Slidezy.prototype._stopAutoPlay = function () {
    clearInterval(this.autoPlayTimer);
    this.autoPlayTimer = null;
};

Slidezy.prototype._createContent = function () {
    this.slidezyContent = document.createElement('div');
    this.slidezyContent.className = 'slidezy-content';

    this.container.appendChild(this.slidezyContent);
};

Slidezy.prototype._createTrack = function () {
    this.slidezyTrack = document.createElement('div');
    this.slidezyTrack.className = 'slidezy-track';

    if (this.otp.loop) {
        const cloneHead = this.slides
            .slice(-this.otp.items)
            .map((slide) => slide.cloneNode(true));
        const cloneTail = this.slides
            .slice(0, this.otp.items)
            .map((slide) => slide.cloneNode(true));

        this.slides = cloneHead.concat(this.slides.concat(cloneTail));
    }

    this.slides.forEach((slide) => {
        slide.classList.add('slidezy-slide');
        slide.style.flexBasis = `calc(100% / ${this.otp.items})`;
        this.slidezyTrack.appendChild(slide);
    });

    this.slidezyContent.appendChild(this.slidezyTrack);
};

Slidezy.prototype._createControl = function () {
    this.prevBtn = this.otp.prevButton
        ? document.querySelector(this.otp.prevButton)
        : document.createElement('button');

    this.nextBtn = this.otp.nextButton
        ? document.querySelector(this.otp.nextButton)
        : document.createElement('button');

    if (!this.otp.prevButton) {
        this.prevBtn.innerText = this.otp.controlText[0];
        this.prevBtn.className = 'slidezy-prev';
        this.slidezyContent.appendChild(this.prevBtn);
    }

    if (!this.otp.nextButton) {
        this.nextBtn.innerText = this.otp.controlText[1];
        this.nextBtn.className = 'slidezy-next';
        this.slidezyContent.appendChild(this.nextBtn);
    }

    const slideSize =
        this.otp.slideBy === 'page' ? this.otp.items : this.otp.slideBy;

    this.prevBtn.onclick = () => this.moveSlide(-slideSize);
    this.nextBtn.onclick = () => this.moveSlide(slideSize);
};

Slidezy.prototype._getSlideCount = function () {
    return this.slides.length - (this.otp.loop ? this.otp.items * 2 : 0);
};

Slidezy.prototype._createNav = function () {
    this.navWrapper = document.createElement('div');
    this.navWrapper.className = 'slidezy-nav';

    this.slidesCount = this._getSlideCount();

    this.pageCount = Math.ceil(this.slidesCount / this.otp.items);

    for (let i = 0; i < this.pageCount; i++) {
        const dot = document.createElement('button');
        dot.className = 'slidezy-dot';

        if (i === 0) dot.classList.add('active');
        dot.onclick = () => {
            this.currentIndex = this.otp.loop
                ? i * this.otp.items + this.otp.items
                : i * this.otp.items;
            this._updatePosition();
        };

        this.navWrapper.appendChild(dot);
    }

    this.container.appendChild(this.navWrapper);
};

Slidezy.prototype.moveSlide = function (step) {
    if (this._inAnimation) return;
    this._inAnimation = true;

    const maxIndex = this.slides.length - this.otp.items;
    this.currentIndex = Math.min(
        Math.max(this.currentIndex + step, 0),
        maxIndex,
    );

    setTimeout(() => {
        if (this.otp.loop) {
            const slideCount = this._getSlideCount();

            if (this.currentIndex < this.otp.items) {
                this.currentIndex += slideCount;
                this._updatePosition(true);
            } else if (this.currentIndex > slideCount) {
                this.currentIndex -= slideCount;
                this._updatePosition(true);
            }
        }
        this._inAnimation = false;
    }, this.otp.speed),
        this._updatePosition();
};

Slidezy.prototype._updateNav = function () {
    let realIndex = this.currentIndex;

    if (this.otp.loop) {
        const slideCount = this.slides.length - this.otp.items * 2;
        realIndex =
            (this.currentIndex - this.otp.items + slideCount) % slideCount;
    }

    const pageIndex = Math.floor(realIndex / this.otp.items);

    const dots = Array.from(this.navWrapper.children);

    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === pageIndex);
    });
};

Slidezy.prototype._updatePosition = function (instant = false) {
    this.slidezyTrack.style.transition = instant
        ? 'none'
        : `transform ${this.otp.speed}ms ease`;
    this.offset = -(this.currentIndex * (100 / this.otp.items));
    this.slidezyTrack.style.transform = `translateX(${this.offset}%)`;

    if (this.otp.nav && !instant) {
        this._updateNav();
    }
};
