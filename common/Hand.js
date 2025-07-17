
const MULT_VALUES = [23, 24, 9, 10, 11, 12];
const NULL_VALUES = [23, 35, 46, 59];

class Hand {
    constructor(trumpSuit = -1, matadors = 1) {
        this.trumpSuit = trumpSuit;
        this.matadors = matadors;
        this.hand = false;
        this.schneider = false;
        this.schneiderAnnounced = false;
        this.schwarz = false;
        this.schwarzAnnounced = false;
        this.ouvert = false;

        this.playerPoints = 0;
        this.defensePoints = 0;
    }

    startValue() {
        return this.value([
            this.hand,
            this.schneiderAnnounced,
            this.schwarzAnnounced,
            this.ouvert
        ]);
    }

    endValue() {
        return this.value([
            this.hand, 
            this.schneider, 
            this.schneiderAnnounced, 
            this.schwarz, 
            this.schwarzAnnounced,
            this.ouvert
        ]);
    }

    multipliers() {
        return [this.hand, this.schneider, this.schneiderAnnounced, this.schwarz, this.schwarzAnnounced, this.ouvert].filter((m) => m).length + 1;
    }

    value(mults) {
        let base = MULT_VALUES[this.trumpSuit + 2] * (Math.abs(this.matadors) + 1);
        if(this.trumpSuit !== -2) {
            base += MULT_VALUES[this.trumpSuit + 2] * mults.filter((m) => m).length;
        } else {
            let nullMultipliers = 0;
            if(this.hand) {
                nullMultipliers++;
            }
            if(this.ouvert) {
                nullMultipliers += 2;
            }
            base = NULL_VALUES[nullMultipliers];
        }
        return base;
    }

    multiplierMap() {
        return {
            'Hand' : this.hand,
            'Schneider': this.schneider,
            'Schneider Announced' : this.schneiderAnnounced,
            'Schwarz': this.schwarz,
            'Schwarz Announced': this.schwarzAnnounced,
            'Ouvert': this.ouvert
        }
    }
}

module.exports['Hand'] = Hand;