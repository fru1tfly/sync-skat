import { useMediaQuery } from "react-responsive";

const GameTypeButton = (props) => {
    const { label, iconType, iconContent, gameIndex, selected, select } = props;
    const isStacked = useMediaQuery({ query: '(max-width: 620px)' });

    const gameIcon = () => {
        if(iconType === 'text') {
            return (
                <div className="icon icon-text">
                    {iconContent}
                </div>
            );
        } else {
            return <img src={iconContent} className="icon icon-image"/>
        }
    };
    
    const iconOrder = () => {
        if(!isStacked) return 0;
        switch(gameIndex) {
            case -2:
                return 4;
            case -1:
                return 0;
            case 0:
                return 6;
            case 1:
                return 5;
            case 2:
                return 2;
            case 3:
                return 1;
            default:
                return 0;
        }
    }

    return (
        <div style={{order: iconOrder()}} className={selected ? 'border-s round-m game-icon game-icon-selected' : 'border-s round-m game-icon'} onClick={() => select(gameIndex)}>
            {gameIcon()}
            <div className="game-icon-caption">
                {label}
            </div>
        </div>
    );
}

export default GameTypeButton;