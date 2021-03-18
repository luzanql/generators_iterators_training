#! /usr/bin/env node

/*const axios = require('axios');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.output,
    prompt: 'enter command > '
});

readline.prompt();*/
const axios = require('axios');
const { timeStamp, time } = require('console');
const { parse } = require('path');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'enter command > ',
});
readline.prompt();

readline.on('line', async line => {
    switch (line.trim()) {
        case 'list vegan foods':
            {
                await axios.get(`http://localhost:3001/food`).then(({data}) => {
                    let idx = 0;
                    veganOnly = data.filter(food => {
                        return food.dietary_preferences.includes('vegan');
                    })
                    const veganIterable = {
                        [Symbol.iterator]() {
                            return {
                                [Symbol.iterator]() { return this; },
                                next(){
                                    const current = data[idx];
                                    idx++;
                                    if (current) {
                                        return {value: current, done: false}
                                    } else {
                                        return {value: current, done: true}
                                    }
                                }
                            }
                        }
                    };
                    for (let val of veganIterable) {
                        console.log(val.name)
                    }
                    readline.prompt();
                });

                console.log('vegan food list');
            }
            break;
        case 'log':
        readline.question(`What would you like to log today? `,  async (item) => {
            const { data } =  await axios.get('http://localhost:3001/food');
            const it = data[Symbol.iterator]();
            let actionIt;
            const actionIterator = {
                [Symbol.iterator]() {
                    let positions = [...this.actions];
                    return {
                        [Symbol.iterator]() {
                            return this;
                        },
                        next(...args) {
                            if (positions.length > 0) {
                                const position = positions.shift();
                                const result = position(...args);
                                return {value: result, done: false}
                            } else {
                                return {done : false}
                            }
                        },
                        return() {
                          positions = [];
                          return {done : false}
                        },
                        throw(error) {
                          console.log(error);
                          return { value: undefined, done: true};
                        },
                    }
                },
                actions: [askForServingSize, displayCalories]
            };

            function askForServingSize(food) {
                    readline.question(`How many servings did you eat? (as a decimal: 1, 0.5, 1.25, etc)`,
                    // The callback llamamos a next
                    servingSize => {
                        if (servingSize === 'nevermind') {
                          actionIt.return();
                        }
                        try {
                          actionIt.next(servingSize, food)
                        } catch (error) {
                          actionIt.throw(error);
                        }
                    },
                );
            }

            async function displayCalories(servingSize = 1, food) {
                const calories = food.calories;
                console.log(
                  `${
                    food.name
                  } with a serving size of ${servingSize} has ${Number.parseFloat(
                    calories * Number.parseFloat(servingSize).toFixed(2),
                  ).toFixed(2)} calories.`,
                );

                const { data } = await axios.get(`http://localhost:3001/users/1`);

                const usersLog = data.log || [];
                const putBody = {
                  ...data,
                  log: [
                    ...usersLog,
                    {
                      [Date.now()]: {
                        food: food.name,
                        servingSize,
                        calories: Number.parseFloat(
                          calories * Number.parseFloat(servingSize).toFixed(2)
                        )
                      }
                    }
                  ]
                };

                await axios.put(`http://localhost:3001/users/1`, putBody, {
                  headers: {
                    'Content-Type':'application/json',
                  }
                });

                actionIt.next();
                readline.prompt();
            }

            let position = it.next(); // Esto es un objeto con un value property y un done property
            while (!position.done) {
                const food = position.value.name;
                if (food ===  item) {
                    console.log(`${item} has ${position.value.calories} calories`);
                    actionIt = actionIterator[Symbol.iterator]();
                    actionIt.next(position.value);
                }
                position = it.next();
            }
            readline.prompt();
        })
        break;
        case `today's log`:
          readline.question('Email:', async emailAddress => {
            const { data } = await axios.get(
              `http://localhost:3001/users?email=${emailAddress}`
            );

            const foodLog = data[0].log || [];
            let totalCalories = 0;

            function* getFoodLog() {
              yield* foodLog;
            }

            for (const entry of getFoodLog()) {
              const timestamp = Object.keys(entry)[0];
              if (isToday(new Date(Number(timestamp)))){
                console.log(
                  `${entry[timestamp].food}, ${entry[timestamp].servingSize} servings`
                );
                totalCalories += entry[timestamp].calories;
              }
            }
            console.log('---------------------');
            console.log(`Total Calories:  ${totalCalories}`);
            readline.prompt();
          }
          )
          break;
    }
});

function isToday(timestamp) {
  const today = new Date();
  return (
    timestamp.getDate() ===  today.getDate() &&
    timestamp.getMonth() === today.getMonth() &&
    timestamp.getFullYear() === today.getFullYear()
  );
}