const selectors = ["article", "main article", "Article", "main#content", "#story"]

let article = null;
for (const selector of selectors) {
    article = document.querySelector(selector);

    if (article) {
        break;
    }
}
console.log("Article found", article);


if (article && !document.location.hostname.endsWith("reddit.com")) {
    // Get headline
    headline = get_article_headline(article);

    article_content = article.textContent;

    async function postData() {

        // Run API Request
        const data = await run_API_request(headline, article_content);

        // Create div element for the banner
        let responseDiv = document.createElement("div");

        // Add content to responseDiv for when a match is found
        if (data.match_found) {
            responseDiv = add_content_match_found(responseDiv, data);

            // No fact check article found
        } else {
            return; // Hide banner showing no match found.
            responseDiv.innerHTML = `
        <p style="font-weight: bold;">This news article has <span style="color: blue">not</span> been classified as fake news.</p>
        <p>Score: ${data.score}</p>
      `;
        }

        // Add visual styles to the banner
        responseDiv = add_style(responseDiv);

        // Check for Extension update, and add notice to the responseDiv();
        if (!data.extension_up_to_date) {
            console.log("An update is available to this extension.");
            responseDiv.appendChild(get_update_available_div());
        }


        // Add banner to website
        add_banner_to_website(responseDiv);

    }
    postData();
}


async function run_API_request(headline, article_content=null) {

    // Current version
    const EXTENSION_VERSION = 1.1;

    console.log("Sending API request.");
    const url = 'https://newswise.online/process_article';

    var payload = null;
    if (article_content) {
        payload = JSON.stringify({  'headline': headline,
                                    'article_text': article_content,
                                    'extension_version': EXTENSION_VERSION})
    } else {
        payload = JSON.stringify({  'headline': headline,
                                    'extension_version': EXTENSION_VERSION})
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: payload,
    });

    const data = await response.json();
    console.log("API request successful.");

    return data
}

function get_article_headline(article) {

    let heading = article.querySelector("h1");
    if (!heading) {
        // This works better for some articles (eg Washington Post)
        heading = document.querySelector("h1");
    }
    if (document.location.hostname.endsWith("scientificamerican.com")) {
        heading = document.querySelector("h3");
    }
    const headline = heading.textContent.trim();

    return headline
}

function add_style(responseDiv) {
    responseDiv.style.marginTop = "10px";
    responseDiv.style.marginBottom = "10px";
    responseDiv.style.padding = "30px";

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // Dark mode background
        responseDiv.style.backgroundColor = "#7D7D7D";
    } else {
        // Normal backgroudn
        responseDiv.style.backgroundColor = "#fffcf4";
    }


    // responseDiv.style.backgroundColor = "#fffcf4";
    responseDiv.style.borderRadius = "3px";
    responseDiv.style.fontFamily = "Nunito, sans-serif";

    responseDiv.style.fontSize = "16px";
    // responseDiv.style.fontWeight = "normal";
    // responseDiv.style.fontWeight = "bold";

    // responseDiv.style.height = "100px";
    responseDiv.style.position = "relative"; // Make the responseDiv position relative
    responseDiv.style.overflow = "hidden"; // Hide the overflow of the responseDiv


    // Add the NEWSWISE branding to the responseDiv
    responseDiv.appendChild(get_newswise_branding_div());

    return responseDiv;
}

function get_newswise_branding_div() {
    // Create a new element for the NEWSWISE text
    const newswiseDiv = document.createElement("div");
    newswiseDiv.innerHTML = "NEWSWISE";
    newswiseDiv.style.position = "absolute"; // Position the newswiseDiv absolutely
    newswiseDiv.style.right = "10px"; // Position the newswiseDiv on the right side
    newswiseDiv.style.bottom = "5px"; // Position the newswiseDiv at the bottom
    newswiseDiv.style.fontSize = "16px"; // Set the font size to 12px
    newswiseDiv.style.fontWeight = "300";
    newswiseDiv.style.color = "#999"; // Set the font color to light grey

    return newswiseDiv;
}

function get_update_available_div() {
    // Create a new element for the NEWSWISE text
    const newswiseDiv = document.createElement("div");
    const newswise_link = "https://newswisetp20.azurewebsites.net/Home/NewsSpotter";
    newswiseDiv.innerHTML = `<a href=${newswise_link} style="text-decoration: none;">An update is available for this extension</a>`;
    newswiseDiv.style.position = "absolute"; // Position the newswiseDiv absolutely
    newswiseDiv.style.left = "10px"; // Position the newswiseDiv on the right side
    newswiseDiv.style.bottom = "5px"; // Position the newswiseDiv at the bottom
    newswiseDiv.style.fontSize = "8px"; // Set the font size to 12px
    newswiseDiv.style.fontWeight = "300";
    newswiseDiv.style.color = "#999"; // Set the font color to light grey

    return newswiseDiv;
}


function add_content_match_found(responseDiv, data) {

    // Choose Accent Colour
    var img="";
    let accent_colour;
    if (data.rating_classification === "True") {
        img='<img src="https://upload.wikimedia.org/wikipedia/commons/8/8b/Eo_circle_green_white_checkmark.svg" style="width:30px;height:30px"/>';
        accent_colour = "#548C2F";
    } else if (data.rating_classification === "False") {
        img='<img src="https://upload.wikimedia.org/wikipedia/commons/9/95/Error-Logo.png" style="width:30px;height:30px"/>';
        accent_colour = "#bf1220";
    } else if (data.rating_classification === "Misleading") {
        img='<img src="https://www.pngall.com/wp-content/uploads/2017/05/Alert-Download-PNG.png" style="width:30px;height:30px"/>';
        accent_colour = "#F9A620"
    }
    

     // 构造 img 标签的 HTML 代码
    
    
    // Format text
    const words = data.main_description.split(" ");
    const lastWord = words.pop().slice(0, -1); //Get last word and remove final character (full stop)
    const main_description = words.join(" ") + ` <span style="color: ${accent_colour}">${lastWord}</span>.`;



    // Add text to responseDiv
    responseDiv.innerHTML = `
    <div style="display:flex">
    <div>${img}</div>
    <div style="margin-left: 10px;">
    <p style="font-weight: bold;">${main_description}</p>
    <p><span>Click </span><a id="expand-link" href="#">here</a><span> to learn more.</span></p>
    </div>
    </div>`;
    // <p>Score: ${data.score}</p>

    // Allow expandable part to work
    const expandLink = responseDiv.querySelector("#expand-link");
    expandLink.addEventListener("click", function (event) {
        console.log("Expanding link clicked");

        event.preventDefault();
        console.log("Expanding link clicked");
        // Update the banner div's height
        // responseDiv.style.height = "300px";


        // Get Link for our website
        const newswise_link = get_newswise_search_link(data);

        // Update the text
        responseDiv.innerHTML = `
        <div style="display:flex">
        <div>${img}</div>
        <div style="margin-left: 10px;">
        <p style="font-weight: bold;">${main_description}</p>
        <p>${data.extended_description.replace(/\n/g, '<br><br>')}</p>
        <p><span>Click </span><a id="expand-link" href=${newswise_link}>here</a><span> to find out more information from our website.</span></p>
        </div>
        </div>
        `; 
        //         <p>Score: ${data.score}</p><br>

        // Put NEWSWISE branding back in
        responseDiv.appendChild(get_newswise_branding_div());

        // Check for update, and put update text back in.
        if (!data.extension_up_to_date) {
            console.log("An update is available to this extension.");
            responseDiv.appendChild(get_update_available_div());
        }

    });
    return responseDiv;
}


function add_banner_to_website(responseDiv) {
    /* 
      Below are the sites that this works for:
      - abc.net.au
      - news.com.au
      - washingtonpost.com
      - wikipedia.org
      - theguardian.com
      - au.news.yahoo.com
      - 9news.com.au
      - Pedestrian.tv
      - Reddit.com

      Sites that it somewhat works on:
      - theage.com.au - For some reason it usually works if you refresh an article, but doesn't work the first time you load it.

      Sites that this is known not to work for
      - skynews.com.au
      - 3aw.com.au

      */



    const website_name = document.location.hostname;

    // abc.net.au
    if (website_name.endsWith("abc.net.au")) {
        const date = article.querySelector("time")?.parentNode;
        date?.insertAdjacentElement("afterend", responseDiv);

    // news.com.au
    } else if (website_name.endsWith("www.news.com.au")) {
        console.log("website publisher: news.com.au")
        const storyPrimary = document.querySelector("#story-primary");
        storyPrimary.insertBefore(responseDiv, storyPrimary.firstChild);

    // wikipedia
    } else if (website_name.endsWith("wikipedia.org")) {
        console.log("website publisher: wikipedia");
        const bodyContent = document.querySelector("#bodyContent");
        bodyContent.insertBefore(responseDiv, bodyContent.firstChild);

    // yahoo news
    } else if (website_name.endsWith("au.news.yahoo.com")) {
        document.querySelectorAll("[id^='caas-art'] *[class='caas-body']").forEach((element) => {
            // Perform actions on each matching element
            console.log(element);
            element.insertAdjacentElement("beforebegin", responseDiv)
            return;
        });

    // Washington post
    } else if (website_name.endsWith("washingtonpost.com")) {
        const body_content = document.querySelector("#__next > div.grid-layout > main > article > div.grid-body > div.teaser-content.grid-center");
        body_content.insertAdjacentElement("beforebegin", responseDiv);

    // Scientific american
    } else if (website_name.endsWith("scientificamerican.com")) {
        const body_content = document.querySelector("#sa_body > article > div > div > section");
        body_content.insertAdjacentElement("beforebegin", responseDiv);y

    // Pedestrian.tv
    } else if (website_name.endsWith("pedestrian.tv")) {
        const body_content = document.querySelector("[id^='post-'] > div.article-body");
        body_content.insertAdjacentElement("beforebegin", responseDiv);

    // The age.com.au
    } else if (website_name.endsWith("age.com.au")) {
        const body_content = document.querySelector("#content > div > article");
        const secondChild = body_content.children[1];
        body_content.insertBefore(responseDiv, secondChild.nextSibling);

    // reddit.com
    } else if (website_name.endsWith("reddit.com")) {
        const title_block = document.querySelector("[id^='t3_']");
        title_block.insertAdjacentElement("afterend", responseDiv);
    }

    // Any other website
    else {
        console.log("Website publisher: Other")
        const location_for_banner = article.querySelector("h1")?.parentNode;
        location_for_banner?.insertAdjacentElement("afterend", responseDiv);

    }
}


function get_newswise_search_link(data) {
    const keywords = data.keywords;
    const search_string = keywords.replace(/ /g, "+");
    url = `https://newswisetp20.azurewebsites.net/ClaimReviews/Index?searchString=${search_string}`
    return url;
}


if (document.location.hostname.endsWith("reddit.com")) {
    window.onload = function() {
        setTimeout(function() {
            reddit();
        }, 1000);
    }
};


async function reddit() {

    // Check Heading
    const headding = document.querySelector("[id^='post-title']").textContent;
    var data = await run_API_request(headding);
    console.log(`Heading: ${headding}`);
    console.log(`Result: ${data.match_found}`);
    // Heading is Fake News
    if (data.match_found) {

        // Add content to responseDiv for when a match is found
        if (data.match_found) {
            console.log("Match found in heading")
            // Reword to make relevant for Reddit Comment section
            data.main_description = data.main_description.replace("This article may contain information which has been", 
                                                                  "This Reddit post may contain information which has been");

            // Create div element for the banner
            let responseDiv = document.createElement("div");

            // Add text to banner
            responseDiv = add_content_match_found(responseDiv, data);

            // Add visual styles to the banner
            responseDiv = add_style(responseDiv);

            // Add banner to website
            console.log("Trying to add the banner:");
            add_banner_to_website(responseDiv);

            // Stop iterating through comments
            return;
        }
    };


    // Check Main Post content
    try {
        const post_content = document.querySelector('[id^="t3"][id$="-post-rtjson-content"]').textContent;
        var data = await run_API_request(post_content);

        console.log(`Post content: ${post_content}`);
        console.log(`Result: ${data.match_found}`);

        // Main post content is Fake News
        if (data.match_found) {

            // Create div element for the banner
            let responseDiv = document.createElement("div");

            // Add content to responseDiv for when a match is found
            if (data.match_found) {
                // Reword to make relevant for Reddit Comment section
                data.main_description = data.main_description.replace("This article may contain information which has been", 
                                                                      "This Reddit post may contain information which has been");

                // Add content to banner
                responseDiv = add_content_match_found(responseDiv, data);

                // Add visual styles to the banner
                responseDiv = add_style(responseDiv);

                // Add banner to website
                console.log("Trying to add the banner:");
                add_banner_to_website(responseDiv);

                // Stop iterating through comments
                return;
            }
        };
    } catch (error) { // Do nothing
    };


    // Extract all Comments
    const comments = document.querySelectorAll("#-post-rtjson-content");

    console.log(`Number of comments: ${comments.length}`)

    for (const comment of comments) {
        console.log(`Running comment: ${comment.textContent}`)
        var data = await run_API_request(comment.textContent);

        // Data is Fake News
        if (data.match_found) {
            

            // Add content to responseDiv for when a match is found
            if (data.match_found) {
                console.log("Match found!")

                // Reword to make relevant for Reddit Comment section
                data.main_description = data.main_description.replace("This article may contain information which has been", 
                                                                      "The comment section of this Reddit post may contain information which has been");

                // Create div element for the banner
                let responseDiv = document.createElement("div");

                // Add Content to banner
                responseDiv = add_content_match_found(responseDiv, data);

                // Add visual styles to the banner
                responseDiv = add_style(responseDiv);

                // Add banner to website
                console.log("Trying to add the banner:");
                add_banner_to_website(responseDiv);

                // Stop iterating through comments
                break;
            }

            
        }
    };

}



