// Инициализация видео
const video = document.querySelector('.video-background');
video.muted = true;
video.playsInline = true;
video.preload = 'auto';
video.currentTime = 0;

// Функция определения мобильного устройства
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Оптимизация: дождаться загрузки важных ресурсов
window.addEventListener('load', () => {
  const isMobile = isMobileDevice();
  
  // Инициализация Swiper после загрузки страницы
  const swiper = initSwiper(isMobile);
  initVideoControls(swiper, isMobile);
});

function initSwiper(isMobile) {
  return new Swiper('.swiper', {
    speed: isMobile ? 400 : 600,
    mousewheel: {
      sensitivity: 1.2,
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
    resistanceRatio: 0.7,
    threshold: 10,
    preventInteractionOnTransition: true,
    followFinger: true,
    slideToClickedSlide: false,
    watchSlidesProgress: true,
    watchSlidesVisibility: true,
    allowTouchMove: true,
    shortSwipes: true,
    longSwipes: true,
    touchStartPreventDefault: true,
    
    // Параметры для визуального смещения текста
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
  let isVideoAnimating = false;
  let lastSlideIndex = swiper.activeIndex;
  
  // Сохраняем позиции видео для каждого слайда
  const videoPositions = [];
  
  // Установка начальной позиции видео
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
  
  // Расчет позиций видео для каждого слайда
  const calculateVideoPositions = () => {
    const slideCount = swiper.slides.length;
    const segment = video.duration / (slideCount - 1);
    
    for (let i = 0; i < slideCount; i++) {
      videoPositions[i] = Math.max(0.1, i * segment);
    }
  };
  
  // Запуск видео
  const startVideoPlayback = () => {
    const playPromise = video.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error('Video playback error:', error);
      });
    }
  };
  
  // Обработчик изменения слайда (общий для всех типов навигации)
  const handleSlideChange = function() {
    // Пропускаем обработку если слайд не изменился
    if (this.activeIndex === lastSlideIndex) return;
    
    // Получаем целевую позицию видео для текущего слайда
    const targetTime = videoPositions[this.activeIndex];
    const currentTime = video.currentTime;
    
    // Отменяем предыдущую анимацию
    if (videoAnimation) {
      videoAnimation.kill();
      isVideoAnimating = false;
    }
    
    // Определяем направление перехода
    const direction = this.activeIndex > lastSlideIndex ? 1 : -1;
    lastSlideIndex = this.activeIndex;
    
    // Общая логика анимации
    video.classList.add('change');
    isVideoAnimating = true;
    
    // Рассчитываем длительность анимации
    const timeDifference = Math.abs(targetTime - currentTime);
    const maxDuration = isMobile ? 0.8 : 1.2;
    const minDuration = isMobile ? 0.3 : 0.5;
    
    // Динамическая длительность на основе расстояния
    let duration = Math.min(maxDuration, Math.max(minDuration, timeDifference * 0.5));
    
    // Для очень близких переходов делаем минимальную анимацию
    if (timeDifference < 0.5) {
      duration = minDuration;
    }
    
    // Для мобильных: упрощенная анимация с короткой длительностью
    if (isMobile) {
      // Минимальная длительность для мобильных
      duration = Math.min(0.6, Math.max(0.4, duration));
      
      videoAnimation = gsap.to(video, {
        duration: duration,
        currentTime: targetTime,
        ease: "power2.out",
        overwrite: "auto",
        onComplete: () => {
          videoAnimation = null;
          isVideoAnimating = false;
          video.classList.remove('change');
        }
      });
    } 
    // Для десктопа: более сложная анимация
    else {
      videoAnimation = gsap.to(video, {
        duration: duration,
        currentTime: targetTime,
        ease: direction > 0 ? "power2.out" : "power2.in",
        overwrite: "auto",
        onComplete: () => {
          videoAnimation = null;
          isVideoAnimating = false;
          video.classList.remove('change');
        }
      });
    }
  };

  // Подписка на события Swiper
  swiper.on('slideChangeTransitionStart', handleSlideChange);
  
  // Обработчик для пагинации (буллитов)
  swiper.on('slideChange', function() {
    if (this.clickedIndex !== undefined) {
      handleSlideChange.call(this);
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
  
  // Перезапуск видео при завершении
  video.addEventListener('ended', () => {
    video.currentTime = 0.1;
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