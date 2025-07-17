import dImg from '../assets/diamonds.svg';
import hImg from '../assets/hearts.svg';
import sImg from '../assets/spades.svg';
import cImg from '../assets/clubs.svg';
import { getCardWidth } from '../components/utils';

const suitSVGs = [dImg, hImg, sImg, cImg];
const suitImages = [];
const CARD_LABELS = ['7', '8', '9', 'J', 'Q', 'K', 'I0', 'A'];
const CARD_VALUES = [0, 0, 0, 2, 3, 4, 10, 11];
const CARD_MOVE_TIME = 0.7;

// initialize suit images for use in canvas
for(let svg of suitSVGs) {
    let img = new Image();
    img.src = svg;
    suitImages.push(img);
}

function Card(suit, rank) {
    this.suit = suit;
    this.rank = rank;

    this.position = { x: 0, y: 0, rotation: 0, scale: 1};
    this.oldPos = { x: 0, y: 0, rotation: 0, scale: 1};

	this.screenPos = -1;

    this.hidden = false;
    this.selected = false;
    this.moving = false;
	this.inverted = false;

	this.randomRotation = Math.random() * Math.PI / 16 - Math.PI / 32;

    this.moveTimer = 0;
    this.animStartPos = { x: 0, y: 0, rotation: 0, scale: 0 };
    this.animEndPos = { x: 0, y: 0, rotation: 0, scale: 0 };
    this.animPos = { x: 0, y: 0, rotation: 0, scale: 0 };

    this.draw = (ctx, dt, wid = null) => {

        let w = wid != null ? wid : getCardWidth(ctx.canvas.width, ctx.canvas.height);
        let h = w * 1.6;

        if(!this.moving && (this.oldPos.x !== this.position.x || this.oldPos.y !== this.position.y)) {
            this.moving = true;
            this.animStartPos = { ...this.oldPos };
            this.animEndPos = { ...this.position };
            if(this.position.rotation - this.oldPos.rotation > Math.PI) {
                this.animStartPos.rotation += Math.PI * 2;
            }
			if(this.oldPos.rotation - this.position.rotation > Math.PI) {
				this.animStartPos.rotation -= Math.PI * 2;
			}

            this.moveTimer = CARD_MOVE_TIME;
        }

		ctx.save();
		if(!this.moving) {
			ctx.translate(this.position.x, this.position.y);
			ctx.scale(this.position.scale, this.position.scale);
			ctx.rotate(this.position.rotation);
		} else {
			ctx.translate(this.animPos.x, this.animPos.y);
			ctx.scale(this.animPos.scale, this.animPos.scale);
			ctx.rotate(this.animPos.rotation);
		}
		
		this.drawCardBase(ctx, w, h);
        if(!this.hidden) {
            this.drawCardContents(ctx, w, h);
        }
		ctx.restore();

        if(!isNaN(dt)) {
            if(this.moving && this.moveTimer > 0) {

                this.moveTimer -= (dt / 1000);
                let x = (CARD_MOVE_TIME - this.moveTimer) / CARD_MOVE_TIME;
    
                // cubic ease-in-out
                let computedTime = x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    
                this.animPos.x = this.animStartPos.x + (this.animEndPos.x - this.animStartPos.x) * computedTime;
                this.animPos.y = this.animStartPos.y + (this.animEndPos.y - this.animStartPos.y) * computedTime;
                this.animPos.rotation = this.animStartPos.rotation + (this.animEndPos.rotation - this.animStartPos.rotation) * computedTime;
                this.animPos.scale = this.animStartPos.scale + (this.animEndPos.scale - this.animStartPos.scale) * computedTime;
    
                if(this.moveTimer <= 0) {
                    this.moveTimer = 0;
                    this.moving = false;
                }
            }
            this.oldPos = {...this.position};
        }
    };

    this.drawCardBase = (ctx, w, h) => {

		if(!this.hidden) {
			ctx.fillStyle = '#ccc';
			ctx.beginPath();
			ctx.roundRect(-w / 2, -h / 2, w, h, [w / 8]);
			ctx.fill();
			ctx.closePath();

			if(this.selected) 
				ctx.fillStyle = '#fffd7c';
			else
				ctx.fillStyle = 'white';
			
			ctx.beginPath();
			ctx.roundRect(-w / 2, -h / 2, w, h * 0.96, [w / 8, w / 8, w / 7, w / 7]);
			ctx.fill();
			ctx.closePath();
		} else {
			ctx.fillStyle = 'white';
			ctx.beginPath();
			ctx.roundRect(-w / 2, -h / 2, w, h, [w / 8, w / 8, w / 7, w / 7]);
			ctx.fill();
			ctx.closePath();
		}

		ctx.strokeStyle = "#1B1212";
		ctx.lineWidth = w / 30;
		ctx.beginPath();
		ctx.roundRect(-w / 2, -h / 2, w, h, [w / 8]);
		ctx.stroke();
		ctx.closePath();

		if(this.hidden) {
			ctx.fillStyle = "#3E6468";
			ctx.beginPath();
			ctx.roundRect(-w / 2 + h / 20, -h / 2 + h / 20, w - h / 10, h - h / 10, [w / 14]);
			ctx.fill();
			ctx.closePath();
		}
	};

    this.drawCardContents = (ctx, w, h) => {
		if(this.suit < 2) {
			ctx.fillStyle = "#A42A04";
		} else {
			ctx.fillStyle = "#28282B";
		}

		ctx.font = `500 ${h / 3.25}px Fredoka`;
		let cardLabelWidth = ctx.measureText(CARD_LABELS[this.rank]).width;
		ctx.fillText(CARD_LABELS[this.rank], -cardLabelWidth / 2, -h / 30);
		ctx.drawImage(suitImages[this.suit], -h / 6.5, 0, h / 3.25, h / 3.25);


		ctx.font = `500 ${h / 6}px Fredoka`;
		cardLabelWidth = ctx.measureText(CARD_LABELS[this.rank]).width;

		const sidePadding = w / 13;
		const topPadding = h / 6;
		const smallImageSize = h / 8;

		ctx.fillText(CARD_LABELS[this.rank], -w / 2 + sidePadding, -h / 2 + topPadding);
		ctx.drawImage(suitImages[this.suit], -w / 2 + sidePadding + cardLabelWidth / 2 - smallImageSize / 2, -h / 2 + topPadding * 1.1, smallImageSize, smallImageSize);
		ctx.fillText(CARD_LABELS[this.rank], w / 2 - sidePadding - cardLabelWidth, -h / 2 + topPadding);
		ctx.drawImage(suitImages[this.suit], w / 2 - sidePadding - cardLabelWidth / 2 - smallImageSize / 2, -h / 2 + topPadding * 1.1, smallImageSize, smallImageSize);
	
		if(this.inverted) {
			ctx.fillText(CARD_LABELS[this.rank], -w / 2 + sidePadding, h / 2 - topPadding * 1.2);
			ctx.drawImage(suitImages[this.suit], -w / 2 + sidePadding + cardLabelWidth / 2 - smallImageSize / 2, h / 2 - topPadding * 1.1, smallImageSize, smallImageSize);
			ctx.fillText(CARD_LABELS[this.rank], w / 2 - sidePadding - cardLabelWidth, h / 2 - topPadding * 1.2);
			ctx.drawImage(suitImages[this.suit], w / 2 - sidePadding - cardLabelWidth / 2 - smallImageSize / 2, h / 2 - topPadding * 1.1, smallImageSize, smallImageSize);
		} else {
			ctx.save();
			ctx.rotate(Math.PI);

			ctx.fillText(CARD_LABELS[this.rank], -w / 2 + sidePadding, -h / 2 + topPadding);
			ctx.drawImage(suitImages[this.suit], -w / 2 + sidePadding + cardLabelWidth / 2 - smallImageSize / 2, -h / 2 + topPadding * 1.1, smallImageSize, smallImageSize);
			ctx.fillText(CARD_LABELS[this.rank], w / 2 - sidePadding - cardLabelWidth, -h / 2 + topPadding);
			ctx.drawImage(suitImages[this.suit], w / 2 - sidePadding - cardLabelWidth / 2 - smallImageSize / 2, -h / 2 + topPadding * 1.1, smallImageSize, smallImageSize);

			ctx.restore();
		}
	};

	this.getValue = () => {
		return CARD_VALUES[this.rank];
	};

	this.getKey = () => {
		return `${this.suit}${this.rank}`;
	}
}

export default Card;