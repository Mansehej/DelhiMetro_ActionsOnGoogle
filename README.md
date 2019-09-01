# Delhi Metro Action for Google Assistant

## File Structure

Agent.zip -> Contains dialogflow modules - intents, entities, etc.</br>
index.js -> Webook fulfillment for intents defined in Agent.zip</br>

## Current Features
</br>
->Returns shortest path between 2 interchange stations</br>
->Returns time taken for the path</br>
->Takes into account a penalty for interchanges</br>
->Same Destination and Source handler</br>
->Random Metro Etiquette displayer</br>

## Features To Be Added
</br>
->Return train-towards station (last station of line for the metro to take)</br>
->Return fare</br>
->Add intent to view metro map</br>
->Add option to take nearest metro station (through GPS) as source</br>
->Add intent to take both destination and source parameters in a single call</br>
->Add option to choose from 2 paths if one has lesser interchanges, and the other has a shorter overall travel time if the difference between the 2 is ~10 minutes.

## Working

Step 1: User invokes application in Google Assistant</br>
Step 2: Welcome intent called</br>
Step 3: Destination intent called</br>
Step 4: User gives destination input</br>
Step 5: Check if user input matches Station entity. If no, ask again and go to Step 4.</br>
Step 6: Source intent called</br>
Step 7: User gives source input</br>
Step 8: Check if user input matches Station entity. If no, ask again and go to Step 7.</br>
Step 9: Set to and from parameters, send request to API (https://github.com/Mansehej/DelhiMetroAPI)</br>
Step 10: API returns route, line changes, interchange stations and time taken</br>
Step 11: Format API output in a Basic Card and output it</br>
Step 12: Add speech output along with the card</br>
Step 13: Choose from a random set of given Metro Etiquettes and output it in a Basic Response</br>
Step 14: EXIT


## Usage/Testing

Say 'Talk to Delhi Metro' on Google Assistant enabled devices such as Android Phones, Smart TVs, Google Home, Google Home Mini, Assistant enabled headphones, Android smartwatches, etc. to invoke the action.</br>
Just saying Delhi Metro on Google Assistant will give you a search result about Delhi Metro, with a suggestion box saying 'Try Delhi Metro', which upon pressing invokes this action.</br>
One can also directly get the route by saying something on the lines of: "Ask Delhi Metro the route from Palam to Vaishali" directly in Google Assistant instead of the whole "Talk to Delhi Metro" process.
</br>

### Assistant App Store Page
https://assistant.google.com/services/r/uid/000000475aca689d
