// Инициализация видео
const video = document.querySelector('.video-background');
video.muted = true;
video.playsInline = true;
video.preload = 'auto';
video.currentTime = 0;

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

window.addEventListener('load', () => {
  const isMobile = isMobileDevice();
  const swiper = initSwiper(isMobile);
  initVideoControls(swiper, isMobile);
});

function initSwiper(isMobile) {
  return new Swiper('.swiper', {
    speed: isMobile ? 400 : 600,
    mousewheel: {
      sensitivity: 1,
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
    resistanceRatio: 0.1, // Сопротивление при достижении края (0-1)
    threshold: 10, // Минимальное расстояние свайпа в пикселях (увеличьте для меньшей чувствительности)
    preventInteractionOnTransition: true,
    followFinger: true, // Следить за пальцем при свайпе
    slideToClickedSlide: true,
    watchSlidesProgress: true,
    watchSlidesVisibility: true,
    allowTouchMove: true,
    shortSwipes: true, // Разрешить короткие свайпы
    longSwipes: true, // Разрешить длинные свайпы
    longSwipesRatio: 0.3, // Процент ширины слайда для длинного свайпа
    shortSwipesRatio: 0.1, // Процент ширины слайда для короткого свайпа
    touchStartPreventDefault: true,
    touchReleaseOnEdges: true, // Отпускать на краях
    touchAngle: 90, // Максимальный угол отклонения для горизонтального свайпа
    
    on: {
      progress: function() {
        const slides = this.slides;
        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          const slideProgress = slide.progress;
          const offset = Math.sin(slideProgress * Math.PI/2) * 30;
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
            transition: `${transition}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
          });
        }
      }
    }
  });
}

function initVideoControls(swiper, isMobile) {
  let videoAnimation = null;
  let lastSlideIndex = swiper.activeIndex;
  
  const videoPositions = [];
  
  const setInitialVideoPosition = () => {
    if (video.readyState >= 2) {
      calculateVideoPositions();
      video.currentTime = videoPositions[swiper.activeIndex];
    } else {
      video.addEventListener('loadedmetadata', () => {
        calculateVideoPositions();
        video.currentTime = videoPositions[swiper.activeIndex];
      }, { once: true });
    }
  };
  
  const calculateVideoPositions = () => {
    const slideCount = swiper.slides.length;
    const segment = video.duration / (slideCount - 1);
    
    for (let i = 0; i < slideCount; i++) {
      videoPositions[i] = Math.max(0.1, i * segment);
    }
  };
  
  const startVideoPlayback = () => {
    const playPromise = video.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error('Video playback error:', error);
      });
    }
  };
  
  // УПРОЩЕННАЯ И ОПТИМИЗИРОВАННАЯ ФУНКЦИЯ ОБРАБОТКИ СМЕНЫ СЛАЙДОВ
  const handleSlideChange = function() {
    if (this.activeIndex === lastSlideIndex) return;
    
    const targetTime = videoPositions[this.activeIndex];
    const currentTime = video.currentTime;
    
    // Отменяем предыдущую анимацию
    if (videoAnimation) {
      videoAnimation.kill();
    }
    
    // Рассчитываем базовую длительность анимации
    const timeDifference = Math.abs(targetTime - currentTime);
    const baseDuration = isMobile ? 0.5 : 0.7;
    
    // Рассчитываем динамическую длительность
    let duration = baseDuration;
    
    // Для больших скачков делаем анимацию немного дольше
    if (timeDifference > 3) {
      duration = baseDuration * 1.4;
    }
    // Для маленьких скачков - короче
    else if (timeDifference < 1) {
      duration = baseDuration * 0.7;
    }
    
    // Активируем визуальный эффект
    video.classList.add('change');
    
    // Запускаем оптимизированную анимацию
    videoAnimation = gsap.to(video, {
      duration: duration,
      currentTime: targetTime,
      ease: "power2.out", // Простая и эффективная функция плавности
      overwrite: "auto",
      onComplete: () => {
        videoAnimation = null;
        video.classList.remove('change');
      },
      onUpdate: () => {
        // Синхронизируем видео с прогрессом анимации
        if (Math.abs(video.currentTime - targetTime) < 0.1) {
          videoAnimation.progress(1);
        }
      }
    });
    
    lastSlideIndex = this.activeIndex;
  };

  // ОДИНАКОВАЯ ОБРАБОТКА ВСЕХ ТИПОВ НАВИГАЦИИ
  swiper.on('slideChangeTransitionStart', handleSlideChange);
  
  // Обработка кликов по буллитам
  document.querySelector('.swiper-pagination').addEventListener('click', (e) => {
    if (e.target.classList.contains('swiper-pagination-bullet')) {
      const index = Array.from(e.target.parentNode.children).indexOf(e.target);
      swiper.slideTo(index);
    }
  });

  // Обработчики для кнопок навигации
  const prevBtn = document.querySelector('.swiper-button-prev');
  const nextBtn = document.querySelector('.swiper-button-next');
  
  prevBtn.addEventListener('click', () => {
    swiper.slidePrev();
  });
  
  nextBtn.addEventListener('click', () => {
    swiper.slideNext();
  });
  
  // Перезапуск видео
  video.addEventListener('ended', () => {
    video.currentTime = 0;
    video.play();
  });
  
  // Инициализация
  setInitialVideoPosition();
  startVideoPlayback();
  
  // Восстановление при возврате на вкладку
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      video.play().catch(e => console.log('Video play interrupted:', e));
    }
  });
}