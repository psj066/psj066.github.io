// 스무스 스크롤링을 위한 코드
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Scroll to Top 버튼 동작 (스크롤 시 버튼 보이기)
window.onscroll = function() {toggleScrollToTop()};

function toggleScrollToTop() {
    const scrollToTopButton = document.getElementById("scrollToTopBtn");
    if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
        scrollToTopButton.style.display = "block";
    } else {
        scrollToTopButton.style.display = "none";
    }
}

// Scroll to Top 버튼 클릭 시 페이지 상단으로 스크롤
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 네비게이션 바의 메뉴가 모바일에서 잘 작동하도록 설정
const menuToggle = document.querySelector('.navbar-toggler');
const menuCollapse = document.getElementById('navbarSupportedContent');

menuToggle.addEventListener('click', () => {
    menuCollapse.classList.toggle('collapse');
});

// Scroll to Top 버튼을 위한 HTML 요소 추가
window.addEventListener('DOMContentLoaded', (event) => {
    const scrollToTopButton = document.createElement('button');
    scrollToTopButton.id = "scrollToTopBtn";
    scrollToTopButton.classList.add('btn', 'btn-secondary');
    scrollToTopButton.innerHTML = "Top";
    scrollToTopButton.onclick = scrollToTop;
    document.body.appendChild(scrollToTopButton);

    // 기본적으로 숨겨두기
    scrollToTopButton.style.position = 'fixed';
    scrollToTopButton.style.bottom = '20px';
    scrollToTopButton.style.right = '20px';
    scrollToTopButton.style.display = 'none';
});
