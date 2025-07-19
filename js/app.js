// Инициализация видео
const video = document.querySelector('.video-background');
video.muted = true;
video.playsInline = true;
video.preload = 'auto';
video.currentTime = 0;

// Оптимизация: дождаться загрузки важных ресурсов
window.addEventListener('load', () => {
  // Инициализация Swiper после загрузки страницы
  const swiperText = initSwiper();
  initVideoControls(swiperText);
});

function initSwiper() {
  const swiper = new Swiper('.swiper', {
    speed: 500,
    mousewheel: {
      sensitivity: 1.5,
      releaseOnEdges: true
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
      dynamicBullets: false
    },
    navigation: {
      prevEl: '.swiper-button-prev',
      nextEl: '.swiper-button-next'
    },
    resistanceRatio: 0.5,
    threshold: 5,
    preventInteractionOnTransition: false,
    followFinger: true,
    slideToClickedSlide: false,
    watchSlidesProgress: true,
    watchSlidesVisibility: true,
    allowTouchMove: true,
    shortSwipes: true,
    longSwipes: true,
    touchStartPreventDefault: false,
    
    // Параметры для визуального смещения текста
    on: {
      progress: function() {
        const slides = this.slides;
        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          const slideProgress = slide.progress;
          const offset = slideProgress * 50;
          gsap.set(slide.querySelector('.slide__content'), {
            x: offset
          });
        }
      },
      setTransition: function(transition) {
        const slides = this.slides;
        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          gsap.set(slide.querySelector('.slide__content'), {
            transition: `${transition}ms ease-out`
          });
        }
      }
    }
  });

  return swiper;
}

function initVideoControls(swiperText) {
  let lastSlideIndex = swiperText.activeIndex;
  let videoAnimation = null;
  let isVideoAnimating = false;
  
  // Установка начальной позиции видео
  const setInitialVideoPosition = () => {
    if (video.readyState >= 2) { // HAVE_CURRENT_DATA
      const initialTime = (video.duration / (swiperText.slides.length - 1)) * swiperText.activeIndex;
      video.currentTime = initialTime || 0;
    } else {
      video.addEventListener('loadedmetadata', () => {
        const initialTime = (video.duration / (swiperText.slides.length - 1)) * swiperText.activeIndex;
        video.currentTime = initialTime;
      }, { once: true });
    }
  };
  
  // Запуск видео
  const startVideoPlayback = () => {
    const playPromise = video.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        showPlayButton();
      });
    }
  };
  
  // Обработчики событий Swiper
  swiperText.on('slideChangeTransitionStart', function() {
    video.classList.add('change');
    
    // Рассчитываем целевую позицию видео
    const targetTime = (video.duration / (this.slides.length - 1)) * this.activeIndex;
    
    // Отменяем предыдущую анимацию
    if (videoAnimation) {
      videoAnimation.kill();
      videoAnimation = null;
      isVideoAnimating = false;
    }
    
    // Создаем новую анимацию
    isVideoAnimating = true;
    videoAnimation = gsap.to(video, {
      duration: 0.8,
      currentTime: targetTime,
      ease: "power2.out",
      overwrite: "auto",
      onComplete: () => {
        videoAnimation = null;
        isVideoAnimating = false;
      },
      onInterrupt: () => {
        isVideoAnimating = false;
      }
    });
  });
  
  swiperText.on('slideChangeTransitionEnd', function() {
    video.classList.remove('change');
    lastSlideIndex = this.activeIndex;
  });
  
  // Разрешаем быстрое переключение слайдов
  swiperText.on('slideChange', function() {
    if (isVideoAnimating && videoAnimation) {
      videoAnimation.kill();
      videoAnimation = null;
      isVideoAnimating = false;
    }
  });
  
  // Оптимизация кнопок навигации
  const prevBtn = document.querySelector('.swiper-button-prev');
  const nextBtn = document.querySelector('.swiper-button-next');
  
  const handleNavClick = (direction) => {
    if (isVideoAnimating && videoAnimation) {
      videoAnimation.kill();
      videoAnimation = null;
      isVideoAnimating = false;
    }
    
    if (direction === 'prev') {
      swiperText.slidePrev();
    } else {
      swiperText.slideNext();
    }
  };
  
  prevBtn.addEventListener('click', () => handleNavClick('prev'));
  nextBtn.addEventListener('click', () => handleNavClick('next'));
  
  // Перезапуск видео при завершении
  video.addEventListener('ended', () => {
    video.currentTime = 0;
    video.play();
  });
  
  // Инициализация позиции и воспроизведения
  setInitialVideoPosition();
  startVideoPlayback();
  
  // Восстановление видео при возврате на страницу
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      video.play().catch(e => console.log('Video play interrupted:', e));
    }
  });
}

// Функция для показа кнопки воспроизведения
function showPlayButton() {
  // Проверяем, не добавлен ли уже оверлей
  if (document.getElementById('video-overlay')) return;
  
  const overlay = document.createElement('div');
  overlay.id = 'video-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(5px);
  `;
  
  const playButton = document.createElement('button');
  playButton.textContent = 'Play Video';
  playButton.style.cssText = `
    padding: 15px 30px;
    font-size: 18px;
    background: #fff;
    color: #000;
    border: none;
    border-radius: 30px;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 2px;
    transition: transform 0.3s ease, background 0.3s ease;
  `;
  
  playButton.addEventListener('click', () => {
    video.play().then(() => {
      overlay.remove();
    }).catch(error => {
      console.error('Error playing video:', error);
    });
  });
  
  playButton.addEventListener('mouseenter', () => {
    playButton.style.transform = 'scale(1.05)';
    playButton.style.background = '#f0f0f0';
  });
  
  playButton.addEventListener('mouseleave', () => {
    playButton.style.transform = 'scale(1)';
    playButton.style.background = '#fff';
  });
  
  overlay.appendChild(playButton);
  document.body.appendChild(overlay);
}