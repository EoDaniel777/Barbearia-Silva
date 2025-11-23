const iconMode = document.querySelector("#iconMode");
const divMoon = document.querySelector(".moon");
const bodyblack = document.querySelector("#bodyBlack");
const barberBalck = document.querySelector(".barber-white");
const asideBalck = document.querySelector("#asideBlack");
const sectionCardMode = document.querySelector("#sectionCard");
const cardTextBalck = document.querySelector("#cardTextBalck");


// function changemode
function changeMode(icon){
    if(icon === "./icons/sun.svg"){ // mode black
        iconMode.src = "./icons/sun.svg"
        divMoon.className = "sun";
        bodyblack.className = "bodyblack";
        barberBalck.className = "barberBalck";
        asideBalck.className = "asideBlack";
        sectionCardMode.className = "CardBalck";
        cardTextBalck.className = "cardTextBlack";
        
    }else{ // mode white
        iconMode.src = "./icons/moon.png"
        divMoon.className = "moon";
        bodyblack.className = "";
        barberBalck.className = "barber-white";
        asideBalck.className = "";
        sectionCardMode.className = "card-white";
        cardTextBalck.className = "card-text";
    }
}

// When clicking exchange the theme
iconMode.addEventListener("click", () => {
    const newIcon = iconMode.src.includes("moon.png") ? "./icons/sun.svg" : "./icons/moon.png";
    localStorage.setItem("Modo", newIcon);
    changeMode(newIcon);
});

// When the reload page apply the theme
const savedIcon = localStorage.getItem("Modo") || "./icons/moon.png";
changeMode(savedIcon);