import { useState } from "react";

export const Dropdown = (props) => {
    const { data, selected, setSelected } = props;
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="dropdown-container">
            <div className="dropdown-selected" onClick={() => setExpanded(!expanded)}>
                {data[selected]}
                {expanded && <i className="fa fa-solid fa-caret-up"></i> }
                {!expanded && <i className="fa fa-solid fa-caret-down"></i> }
            </div>
            {expanded && 
                <div className="dropdown-area">
                    {Object.entries(data).map(([key, val]) => {
                        return (
                            <div className={key === selected ? "dropdown-option dropdown-option-selected" : "dropdown-option"}
                                onClick={() => {setSelected(key); setExpanded(false);}}
                            >{val}</div>
                        );
                    })}
                </div>
            }
        </div>
    );
}

export default Dropdown;