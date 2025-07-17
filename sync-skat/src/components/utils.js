export const renderUserName = (user, size, maxWidth = 200, flag = false) => {
    return (
        <div className="username regular" style={{fontSize: size}}>
            <img 
                alt={user?.username} 
                src={user?.profile_pic} 
                width={size * 1.1} height={size * 1.1} 
                className="circle" 
                style={{border: `${Math.ceil(size / 8)}px solid var(--border-primary)`}} 
            />
            <span
                style={{
                    maxWidth: maxWidth,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}
            >{user?.username}</span>
            {flag && 
                <span 
                    className={`flag fi fi-${user?.country}`}
                    style={{
                        borderColor: 'var(--border-primary)',
                        borderStyle: 'solid',
                        borderWidth: `${Math.ceil(size / 10)}px`,
                        borderBottomWidth: `${size / 5}px`,
                        borderRadius: `${Math.ceil(size / 3.5)}px`
                    }} 
                ></span>
            }
        </div>
    );
};

export const handCount = (createType, rounds, tableSize) => {
    if(createType === 'Table') {
        return rounds * tableSize; 
    } else {
        if(tableSize === 3) {
            return `${rounds * 3}/${rounds * 4}`;
        } else {
            return `${rounds * 4}/${rounds * 3}`;
        }
    }
};

export const dateDisplay = (d) => {
    const provided = new Date(d);
    const current = new Date();

    if (provided.getFullYear() === current.getFullYear() && 
        provided.getMonth() === current.getMonth() &&
        provided.getDate() === current.getDate()) {
        return provided.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
    }   
    if (provided.getFullYear() === current.getFullYear()) {
        return provided.toLocaleString([], {
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric', 
            minute: '2-digit'
        });
    } 
    return provided.toLocaleString([], {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric', 
        minute: '2-digit'
    });
}

export const removeKey = (k, { [k]:_, ...o}) => o;

export const GAMES = [
    {
        index: -1,
        label: 'Grand',
        iconType: 'text',
        iconContent: 'G'
    }, {
        index: 3,
        label: 'Clubs',
        iconType: 'image',
        iconContent: '/assets/clubs.svg'
    }, {
        index: 2,
        label: 'Spades',
        iconType: 'image',
        iconContent: '/assets/spades.svg'
    }, {
        index: 1,
        label: 'Hearts',
        iconType: 'image',
        iconContent: '/assets/hearts.svg'
    }, {
        index: 0,
        label: 'Diamonds',
        iconType: 'image',
        iconContent: '/assets/diamonds.svg'
    }, {
        index: -2,
        label: 'Null',
        iconType: 'text',
        iconContent: 'N'
    }
];

const clamp = (num, min, max) => {
    return Math.min(Math.max(min, num), max);
}

export const getCardWidth = (w, h) => {

    // minimum width - 105 equiv pixels
    // maximum width - 185 equiv pixels
    const dpr = window.devicePixelRatio;

    if(w / h > 0.6) {
        return clamp(Math.min(w / 7, h / 3), 95 * dpr, 185 * dpr);
    } else {
        return clamp(Math.min(w / 3, h / 6.2), 95 * dpr, 185 * dpr);
    }
}