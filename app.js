// Select the hero module element using the correct class selector
const hero = document.querySelector('.hero__module');

// Function to remove the last child element from the hero section
function removeElementOnce() {
  if (hero && hero.lastElementChild) {
    hero.lastElementChild.remove();
  }
}

// Add click event listener to the document that triggers the remove function
document.addEventListener('click', removeElementOnce);
