import { useState } from "react";

export const FormValueToggle = (props) => {
    const { title, option1, option2, value, updateValue } = props;

    return (
        <div className="form-row">
            <div className="form-label">
                {title}
            </div>
            <div className="btn-group-btns">
                <div className={`btn-primary btn-group-btn border-s round-m btn-group-first ${value === option1 ? 'selected' : ''}`}
                    onClick={(e) => updateValue(option1)}
                >{option1}</div>
                <div className={`btn-primary btn-group-btn border-s round-m btn-group-last ${value === option2 ? 'selected' : ''}`}
                    onClick={(e) => updateValue(option2)}
                >{option2}</div>
            </div>
        </div>
    );
}

export default FormValueToggle;