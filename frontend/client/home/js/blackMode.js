const iconMode = document.querySelector("#iconMode");
const divMoon = document.querySelector(".moon");
const bodyblack = document.querySelector("#bodyBlack");
const barberBalck = document.querySelector(".barber-white");
const asideBalck = document.querySelector("#asideBlack");
const sectionCardMode = document.querySelector("#sectionCard");
const cardTextBalck = document.querySelector("#cardTextBalck");
const mainLogo = document.querySelector("#mainLogo");
const navLogo = document.querySelector("#navLogo");
const heroSection = document.querySelector("#inicio");


// function changemode
function changeMode(icon){
    const header = document.querySelector("header");
    const navLinks = document.querySelectorAll("nav a");
    const acessarBtn = document.querySelector(".acessar-login-white a");

    if(icon === "/icons/sun.svg"){ // mode black (dark theme)
        iconMode.src = "/icons/sun.svg"
        divMoon.className = "sun";
        bodyblack.className = "bodyblack";
        barberBalck.className = "barberBalck";
        asideBalck.className = "asideBlack";
        sectionCardMode.className = "CardBalck";
        cardTextBalck.className = "cardTextBlack";
        mainLogo.src = "/img/logoWhite.jpeg"; // Logo branca no tema escuro
        navLogo.src = "/img/logoWhite.jpeg"; // Logo BRANCA no navbar (CORRIGIDO)
        heroSection.style.backgroundColor = "#090A0C"; // Fundo PRETO para logo branca (CORRIGIDO)
        header.style.backgroundColor = "#090A0C"; // Navbar preta
        navLinks.forEach(link => link.style.color = "#FFFFFF"); // Links brancos
        if(acessarBtn) acessarBtn.style.color = "#FFFFFF"; // Botão mantém branco

    }else{ // mode white (light theme)
        iconMode.src = "/icons/moon.png"
        divMoon.className = "moon";
        bodyblack.className = "";
        barberBalck.className = "barber-white";
        asideBalck.className = "";
        sectionCardMode.className = "card-white";
        cardTextBalck.className = "card-text";
        mainLogo.src = "/img/logoDark.jpeg"; // Logo escura no tema claro
        navLogo.src = "/img/logoDark.jpeg"; // Logo escura no navbar
        heroSection.style.backgroundColor = "#FFFFFF"; // Fundo BRANCO para logo escura (CORRIGIDO)
        header.style.backgroundColor = "#090A0C"; // Navbar preta
        navLinks.forEach(link => link.style.color = "#FFFFFF"); // Links brancos
        if(acessarBtn) acessarBtn.style.color = "#FFFFFF"; // Botão branco
    }
}

// When clicking exchange the theme
iconMode.addEventListener("click", () => {
    const newIcon = iconMode.src.includes("moon.png") ? "/icons/sun.svg" : "/icons/moon.png";
    localStorage.setItem("Modo", newIcon);
    changeMode(newIcon);
});

// When the reload page apply the theme
const savedIcon = localStorage.getItem("Modo") || "/icons/moon.png";
changeMode(savedIcon);

// Scroll effect - Logo to navbar & Hide hero
window.addEventListener('scroll', () => {
    const navbarLogo = document.querySelector('#navbarLogo');
    const heroSection = document.querySelector('#inicio');
    const scrollPosition = window.scrollY;

    if (scrollPosition > 200) {
        navbarLogo.style.display = 'block';
        navbarLogo.style.opacity = '1';
        heroSection.style.transform = 'translateY(-100px)';
        heroSection.style.opacity = '0.3';
        heroSection.style.pointerEvents = 'none';
    } else {
        navbarLogo.style.display = 'none';
        navbarLogo.style.opacity = '0';
        heroSection.style.transform = 'translateY(0)';
        heroSection.style.opacity = '1';
        heroSection.style.pointerEvents = 'auto';
    }
});