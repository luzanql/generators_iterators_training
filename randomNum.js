function* randomNum() {
  while(true) {
    yield Math.floor(Math.random() * 100 );
  }
}
const it = randomNum();
function getRandomNumber() {
  return it.next().value;
}

console.log(getRandomNumber());


/* Yield delegation */

