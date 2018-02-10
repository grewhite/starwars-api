
'use strict';
const wrapper = (function(){

  //Variables 
  const content = document.querySelector(".people"),
        nextButton = document.querySelector(".next-button"),
        previousButton = document.querySelector(".previous-button");
  
  let nextLink = "",
      previousLink = "";

  //Cache API 
  const cachedFetch = (url, options) => {
    let expiry = 5 * 60; // 5 min default
    // Use the URL as the cache key to sessionStorage
    let cacheKey = url,
        cached = localStorage.getItem(cacheKey),
        whenCached = localStorage.getItem(cacheKey + ':ts');

    if (cached !== null && whenCached !== null) {
      let age = (Date.now() - whenCached) / 1000;
      if (age < expiry) {
        let response = new Response(new Blob([cached]))
        return Promise.resolve(response)
      } else {
        localStorage.removeItem(cacheKey)
        localStorage.removeItem(cacheKey + ':ts')
      }
    }  
    return fetch(url, options).then(response => {
      if (response.status === 200) {
        response.clone().text().then(content => {
          localStorage.setItem(cacheKey, content)
          localStorage.setItem(cacheKey+':ts', Date.now())
        })
      }
      return response
    })
  };     

  //Get API data
  const getData = (url, type) => {
    //check for type
    switch(type){
      case "people":
      //get data using fetch api
      cachedFetch(url).then((resp) => resp.json()).catch(error => console.error('Error:', error)).then((data) => {
        //setting buttons
        nextLink = data.next;
        previousLink = data.previous;
        //loop through each character 
        for(let character of data.results){
          //destructuring object
          let {name, height, gender, species, homeworld} = character,
            div = createNode("div"),
            promise1 = '',
            promise2 = '';

            if(homeworld.length > 0){
              promise1 = getData(homeworld + "?format=json", "planet");
            }
            if(species.length > 0){
              promise2 = getData(species + "?format=json", "species");
            }

            //get characters planet and species using a promise 
            Promise
              .all([promise1,promise2])
              .then(responses =>{
                //destructuring 
                let [world, characterArray] = responses,
                    [being, classification] = characterArray;
                //Insert Template Literal
                div.innerHTML = `
                  <div class="col-xs-12 col-sm-12 col-md-3">
                    <div class="card">
                      <h2>${name}</h2>
                      <h6>(${classification})</h6>
                      <img src="images/${classification || 'Unknown'}.jpg" />
                      <p>PLANET: ${world || 'Unknown'}</p>
                      <p>SPECIES: <strong>${being || 'Unknown'}</strong></p>
                      <p>GENDER: <strong>${gender || 'Unknown'}</strong></p>
                      <p>HEIGHT: <strong>${height || 'Unkown'}</strong></p>
                    </div>
                  </div>`;
                appendNode(content, div);
              });
        }        
        }).then(()=>{
          //show buttons
          if(nextLink){
            nextButton.classList.add("show");
          }
          if(previousLink){
            previousButton.classList.add("show");
          }
        });
      case "planet":
        return new Promise((resolve, reject) => {      
          if(url) {
            cachedFetch(url).then((resp) => resp.json()).then((planet) => {   
              const world = `<strong>${planet.name}</strong>`;
              resolve(world);
            });            
          } else {
            reject(Error("Unknown"));
          }
        });     
      case "species":
        return new Promise((resolve, reject) => {      
          if(url) {
            cachedFetch(url).then((resp) => resp.json()).then((species) => {   
              const creature = `${species.name}`;
              const classification = `${species.classification}`;
              //return both name and class
              resolve([creature, classification]);
              
            });            
          } else {
            reject(Error(["Unknown", "Unknown"]));
          }
        }); 
    
      default:
          return "N/A";
    }
    return dater(url, type);
  };

  //Functions

  //next page functions
  const toPage = (page) => {
    //clear data
    content.innerHTML = "";
    nextLink = "";
    previousLink = "";
    getData(page, "people");
  };
  //create element function
  const createNode = (element) => {
      return document.createElement(element);
  };
  //append node function
  const appendNode = (parent, el) => {
      return parent.appendChild(el); 
  };

  //Event Listeners
  nextButton.addEventListener("click", () => {
    nextButton.classList.remove("show");
    toPage(nextLink);
  });
  previousButton.addEventListener("click", () => {
    previousButton.classList.remove("show");
    toPage(previousLink);
  });

  //first load
  getData("https://swapi.co/api/people/?format=json", "people");

}());




