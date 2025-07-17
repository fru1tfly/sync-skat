const MultiplierButton = (props) => {
    const { index, label, disabled, selected, select } = props;

    const multiplierStyle = () => {
        if(disabled) {
            return 'multiplier-btn multiplier-btn-disabled border-s round-l';
        } else if(selected) {
            return 'multiplier-btn selected border-s round-l';
        } else {
            return 'multiplier-btn border-s round-l';
        }
    }

    return (
        <div className={multiplierStyle()} disabled={disabled} onClick={() => select(index)}>
            <div className="multiplier-label">{label}</div>
        </div>
    );
}

export default MultiplierButton;