# Abstract

This is my final portfolio, it will showcase the skills I learned throughout my web development course. It will be a professional/ semi-personal site. The goal is to be presented in a professional setting (resume like) while including personal creative touches. The theme will be a mechanical/robotic style website. The focus will be professional so the creative touches will be minimal but the goal is for the website to include:

- light/dark mode
- dynamic 2D animations 
- interactive work experience showcase
- multi device/display adaptibility 


## Development process

### Overview

- Built using vanilla web standards: HTML, CSS, JavaScript
- Followed a process of progressive enhancement
- Website is built with the following in mind: accessibility, usability, portability, maintainability, interchangability, performance, and responsiveness

### Progressive enhancement process and ADR

__1st Step: Raw Text__
- Wrote out the content of each page directly in files
- No tags used but tag placement is inferred with text

__2nd Step: Semantic Structure__
- Placed text into appropriate elements
- No div slop all elements are semantic 
- Built with accessibility, interchangeability, and maintainability in mind

__3rd Step: Reset and Normalization__
- Removed browser default styling
- Added general page styling

__4th Step: Typography and Personality__
- Decided on color palette and font
- Setup spacing, coloring, and sizing variables
- styled elements and page view

__Font usage ADR__
I opted to link the font in my html pages rather than importing in css because of how link renders. When the broswer parses the website it sees the font link immediately and opens that connection in parallel with the rest of the page loading. Wherease, an import would require the browser to first rnder styles.css then start downloading the font (keeping RAIL in mind this saves about 100-300ms). A more nuanced approach would be to download the fonts and store them directly in the repo this will save load time, prevent relying on the link, allow the fonts to be used offline, and ever so slighty reduce the number of lines of code. However, I deemed that approach excessive for my current need and opted for a more lightweight repo.

__5th Step: Spacing and Flow__
- Defined page layout
- Replaced hard coded spacing with variables
- Added media responsiveness 

__6th Step: Color and Branding__
- Finalized color palette specifics 
- dim and bright variants of colors
- established the "feel" of the website (hover, glow, shadow) effects

__7th Step: Hero and Visual Impact__
- Scraped robot idea
- Added Open Graph meta data for a cleaner look when the page is shared on social media
- Restrucutered how the page structure is sized and contained
- Changed the colors of the hero and footer to make them stand out
- Made the nav bar stick to keep it accessible in all parts of the page

__Robot Idea ADR__
The page was originally going to have a robot maschot that will be seen on occasion throughout the page:
    - waving at the user in the hero
    - fixing a lightbulb for the light/dark mode toggle
    - building/reparing mechanical components in the resume section
However, SVG drawing and manipulation proved to be exceedingly difficult to manage considering my time constraint. In order to maintain professionalism that feature was dropped.

__8th Step: Layout and Storytelling__
- Removed the "Behind the Lens" section
- Built cards for experience on the resume
- Added media responsiveness for card grids

__Photography section ADR__
The page was originally designed with the intention of including a photography section however considering time/feature constraints I opted to remove this section. Placing the photography section on the home page would require me to limit the showcase and lead to a "slapped together" look degrading the professional portoflio design I was looking for. Addtionally, I could not afford dedicating a page to my photography considering my time constraint I would have to sacrafice quality, as so I decided to drop that feature for now to be added at a later date.

__9th Step: Interactive Elements__

- Light/dark mode toggle
    - Default root colors are dark, created data-theme attribute that swaps color variables with light palette
    - On first load `window.matchMedia` is used to determine system theme, later preference is stored in localStorage in `theme-preference`
    - On toggle to light `document.documentElement` is used to set the light mode data-theme attribute to the html element
    - on toggle to dark the data-theme is removed from the html element
    - smooth transition of colors added to all page elements
    - Icons for light and dark were created using SVG
    - User preference script was added to all html pages

__User preference script in html pages ADR__ 
Although it violates DRY the decision to add that script to all html pages was reached in a similar fashion to the font link on all html pages. The script runs before styles load that way the right theme is instantly applied. Without it the js file will load after the styles and the user will experience a split second of the wrong theme. the IIFE wrapper on the toggle function (`'use-strict'`) is used a precautionary. it runs the code immediatly and keeps the content variables isolated from global scope. Considering this the violation of DRY was deemed appropriate.

- Contact Form
    - Decided on Web3Form for simplicity considering constraints
    - Form uses native validation for input fields
    - sends user message to web3 enpoint with post (API Key Client Side)
    - botcheck honey pot 
    - mailto fall back incase web3 fails
    - works without javacript

__Web3Forms and client side API ADR__
Web3forms was chosen because it offers a free service with integrated defensive measures. A more self contained approach would invovle a cloudflare worker but constraints prevented that. The API key is a protected resource, however, web3forms use it as a profile identifer and not an access point for privlaged rights. The API key is only used to determine which profile the requests are being passed to. By setting my web3form profile to "restricted domain" any POST request sent from a domain other than my own will be rejected. Additionally, web3forms offer spam protection and by creating a BOT honey pot that passes botcheck when a hidden box is toggled the message request is rejected.Considering the saftey measures in place I opted not to create a server side layer to protect the key.

- Offline snake game
    - Shadow Dom web component
    - Game is built using a 20x20 Grid
    - Snake is an array of cell positions (head - middle - tail)
    - `pendingDirection` is used to prevent illegal movements
    - The snake moves by adjusting unit vector rather than string directions
    - score is stored in localstorage
    - `tickHandle` is how the browser tracks the game
    - to move a new head is added to the front of the snake and the tail removed
    - to grow a new head is added to the front of the snake and the tail is not removed
    - `game/index.html` is the host page for the game
    - the host page creates a theme bridge by assigning existing variables to game variables that are passed to the shadow DOM

- Service Worker
    - sw placed in root to intercept full page requests
    - on first load the sw worker runs `install` to setup and cache content (internet is required for this stage)
    - Promise chain prevents ensures sw install is finished after game assets are cached
    - Uses `caches` service worker API to store game content
    - `Activate` will delete old version caches in case of sw version update
    - `fetch` is the heart of the sw, will intercept every request sent by page
    - if the user tries to naviagte:
        - if online `fetch(request)` goes through
        - if offline cached game is returned
        - if service worker fails return 503 service unavailable
    - fixed routing problems in v1 -> v2 update


- Weather Status Worker
__What it does__:

- Encapusalted shaodw dom web component
- Cloudflare worker that proxies the FAA weather API
- worker was needed because weather API does not expose CORS
- origin request validation before GET to FAA website
- Refresh every 5 minutes to reduce request load

__How it works__:
 
1. Receives a `GET` request from a browser at `atc-weather-proxy.yesinq77.workers.dev`
2. Reads the `Origin` header and checks it against the `ALLOWED_ORIGINS` list
3. Forwards the query to `https://aviationweather.gov/api/data/metar`
4. Wraps the response with `Access-Control-Allow-Origin` headers
5. Returns to the browser, the browser's CORS check now passes

__Worker placement ADR__
The worker does not need to be in the project repository. This violates the readability and clarity of the project repository, however, the decision to add it was made because the worker code will be used for grading.


## Website deployment and links

The website and worker were both deployed using [cloudflare](https://www.cloudflare.com/)

Check out the website at: [personal portfolio](https://my-portfolio-dzn.pages.dev/)

Worker proxy is deployed at: [worker](https://atc-weather-proxy.yesinq77.workers.dev)







