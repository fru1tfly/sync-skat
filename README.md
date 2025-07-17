# SyncSkat

An online multiplayer client to play Skat, the national card game of Germany

## Technology Stack

- React v19: dynamic and responsive frontend content display and logic
- HTML5 Canvas: used for animation of gameplay and displaying dynamic game data as static images
- Socket.io: handling multiplayer gameplay and chat messaging during gameplay
- Auth0: handles authentication and session management
- MySQL: database of user info, tracking game results, and managing event RSVPs
- Node.js: backend framework for server-side logic
- Express: Server framework for API requests and responses and static content hosting
- AWS: Web hosting through EC2, domain management with Route53, and SSL certificate management with ACM

## Screenshots and Feature List

![SyncSkat Lobby](https://github.com/fru1tfly/sync-skat/blob/master/sync-skat/src/assets/screenshot-1.png "SyncSkat Lobby")

Once a user is logged in, they can navigate to the game lobby where they can choose to either join or create a game with other online players. A Table will pair 3 or 4 players depending on the size determined by the creator of the table to play the chosen number of hands (typically 36 for 3 players or 48 for 4). An Event will gather any number of players and assign them to tables once the event begins. The lobby also includes a chat box that can toggle between a lobby-wide chat room and a separate chat room for the Table or Event the player has joined.

![Create an Event](https://github.com/fru1tfly/sync-skat/blob/master/sync-skat/src/assets/screenshot-1p5.png "Create an Event")

When creating an Event (or Table), a user may choose to add a password that other players must enter to join. The event can be set to begin at a given time or to be started manually by the creator of the event. The SyncSkat game mode deals the same cards to all tables participating in the event, in an effort to remove a portion of the element of luck at play in the game and make the event a more direct competition displaying the skill level of the participants. 

![Gameplay](https://github.com/fru1tfly/sync-skat/blob/master/sync-skat/src/assets/screenshot-2.png "Gameplay")

During gameplay, a hand starts with each player being dealt 10 cards with 2 in the center of the table, and a bidding process determines which player will select the trump suit and attempt to earn more than half of the 120 card points in the deck. The game display includes player information in the top left corner, denoting which position each player is fulfilling for that given hand (ForeHand, MiddleHand, and RearHand). The scores are listed below, with an option to expand into a modal that shows a conventional Skat scoresheet, recapping the details of each hand that has been played. Lastly, a third card will display the cards that were played on the previous trick once the hand begins, but until then, shows an hourglass icon. Each of these cards can be enabled or disabled so players on smaller screens can choose which piece of information is most relevant to them at any given time.

![Declaring](https://github.com/fru1tfly/sync-skat/blob/master/sync-skat/src/assets/screenshot-3.png "Declaring")

Once a player wins the bid, they pick up the 2 cards in the center of the table and then choose 2 cards to discard. They can announce one of six game modes, 4 corresponding to the suits of the deck and 2 with specialized rulesets. Optional modifiers can be added to the announcement of the game, but only when players have opted not to pick up the center cards. If they do, these buttons are disabled as shown in the screenshot. 

![During a Hand](https://github.com/fru1tfly/sync-skat/blob/master/sync-skat/src/assets/screenshot-4.png "During a Hand")

Once the game has been announced, the player who won the bid will be displayed in the bottom left, with the game they declared denoted by an icon. As play progresses, previous tricks appear in the third card in the toolbar.

![Results](https://github.com/fru1tfly/sync-skat/blob/master/sync-skat/src/assets/screenshot-5.png "Results")

After a hand is completed, a modal appears displaying the results of the hand. In this screenshot, because the bidder failed to earn more than 60 points, the defense team wins the hand. This means the bidder loses double the value of their hand, plus an additional 50 points when playing with tournament rules, and the other two players are awarded 40 points. Once all players hit the Next button in the bottom right, the game proceeds to the next hand. 

![Scoresheet](https://github.com/fru1tfly/sync-skat/blob/master/sync-skat/src/assets/screenshot-6.png "Scoresheet")

The scoresheet displays the details of each hand, including the base values and multipliers that are tabulated to achieve the final point values. The darker tinted cells indicate which player deals the cards for a given hand, which determines the position of each player for that hand.
