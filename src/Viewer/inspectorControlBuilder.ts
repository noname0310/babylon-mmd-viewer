export class InspectorControlBuilder {
    private readonly _ownerDocument: Document;

    public constructor(ownerDocument: Document) {
        this._ownerDocument = ownerDocument;
    }

    public createLabel(key: string, value: string, onDelete?: () => void): HTMLDivElement {
        const ownerDocument = this._ownerDocument;
        const mainContainer = ownerDocument.createElement("div");
        mainContainer.style.width = "100%";
        mainContainer.style.height = "32px";
        mainContainer.style.padding = "3px 10px";
        mainContainer.style.boxSizing = "border-box";
        mainContainer.style.display = "flex";
        mainContainer.style.flexDirection = "row";
        mainContainer.style.justifyContent = "space-between";
        mainContainer.style.alignItems = "center";
        mainContainer.style.overflow = "hidden";

        const labelKey = ownerDocument.createElement("div");
        labelKey.style.whiteSpace = "nowrap";
        labelKey.style.marginRight = "10px";
        labelKey.style.userSelect = "none";
        labelKey.textContent = key;
        mainContainer.appendChild(labelKey);

        if (onDelete !== undefined) {
            const labelValueContainer = ownerDocument.createElement("div");
            labelValueContainer.style.display = "flex";
            labelValueContainer.style.flexDirection = "row";
            labelValueContainer.style.justifyContent = "end";
            labelValueContainer.style.alignItems = "center";
            mainContainer.appendChild(labelValueContainer);

            const labelValue = ownerDocument.createElement("div");
            labelValue.style.width = "150px";
            labelValue.style.overflowX = "hidden";
            labelValue.style.whiteSpace = "nowrap";
            labelValue.style.textAlign = "right";
            labelValue.textContent = value;
            labelValue.title = value;
            labelValueContainer.appendChild(labelValue);

            const deleteButton = ownerDocument.createElement("button");
            deleteButton.style.width = "18px";
            deleteButton.style.height = "18px";
            deleteButton.style.marginLeft = "5px";
            deleteButton.style.backgroundColor = "rgb(34, 34, 34)";
            deleteButton.style.textAlign = "center";
            deleteButton.style.border = "none";
            deleteButton.style.color = "white";
            deleteButton.textContent = "x";
            deleteButton.onclick = onDelete;
            labelValueContainer.appendChild(deleteButton);
        } else {
            const labelValue = ownerDocument.createElement("div");
            labelValue.style.width = "150px";
            labelValue.style.overflowX = "hidden";
            labelValue.style.whiteSpace = "nowrap";
            labelValue.style.textAlign = "right";
            labelValue.textContent = value;
            labelValue.title = value;
            mainContainer.appendChild(labelValue);
        }
        return mainContainer;
    }

    public createCheckbox(key: string, value: boolean, onChange: (value: boolean) => void): HTMLDivElement {
        const ownerDocument = this._ownerDocument;
        const labelContainer = ownerDocument.createElement("div");
        labelContainer.style.width = "100%";
        labelContainer.style.height = "32px";
        labelContainer.style.padding = "3px 10px";
        labelContainer.style.boxSizing = "border-box";
        labelContainer.style.display = "flex";
        labelContainer.style.flexDirection = "row";
        labelContainer.style.justifyContent = "space-between";
        labelContainer.style.alignItems = "center";

        const labelKey = ownerDocument.createElement("div");
        labelKey.style.width = "auto";
        labelKey.style.minWidth = "40px";
        labelKey.style.overflowX = "auto";
        labelKey.style.whiteSpace = "nowrap";
        labelKey.style.marginRight = "10px";
        labelKey.style.userSelect = "none";
        labelKey.textContent = key;
        labelContainer.appendChild(labelKey);

        const checkBoxInput = ownerDocument.createElement("input");
        checkBoxInput.style.width = "20px";
        checkBoxInput.style.height = "20px";
        checkBoxInput.style.margin = "0";
        checkBoxInput.style.boxSizing = "border-box";
        checkBoxInput.type = "checkbox";
        checkBoxInput.checked = value;
        checkBoxInput.onchange = (): void => {
            onChange(checkBoxInput.checked);
        };
        labelContainer.appendChild(checkBoxInput);

        return labelContainer;
    }

    public createScalarInput(key: string, value: number, min: number, max: number, onChange: (value: number) => void): HTMLDivElement {
        const ownerDocument = this._ownerDocument;
        const mainContainer = ownerDocument.createElement("div");
        mainContainer.style.width = "100%";
        mainContainer.style.height = "32px";
        mainContainer.style.padding = "3px 10px";
        mainContainer.style.boxSizing = "border-box";
        mainContainer.style.display = "flex";
        mainContainer.style.flexDirection = "row";
        mainContainer.style.justifyContent = "space-between";
        mainContainer.style.alignItems = "center";

        const labelKey = ownerDocument.createElement("div");
        labelKey.style.width = "auto";
        labelKey.style.minWidth = "40px";
        labelKey.style.overflowX = "auto";
        labelKey.style.whiteSpace = "nowrap";
        labelKey.style.marginRight = "10px";
        labelKey.style.userSelect = "none";
        labelKey.textContent = key;
        mainContainer.appendChild(labelKey);

        const inputValue = ownerDocument.createElement("input");
        inputValue.style.width = "55px";
        inputValue.style.overflowX = "auto";
        inputValue.style.whiteSpace = "nowrap";
        inputValue.style.backgroundColor = "black";
        inputValue.style.color = "white";
        inputValue.style.fontSize = "16px";
        inputValue.style.border = "none";
        inputValue.style.padding = "3px";
        inputValue.style.margin = "0";
        inputValue.style.height = "20px";
        inputValue.style.boxSizing = "border-box";
        inputValue.style.textAlign = "left";
        inputValue.style.appearance = "textfield";
        inputValue.type = "number";
        inputValue.value = value.toString();
        inputValue.onchange = (): void => {
            let value = parseFloat(inputValue.value);
            if (isNaN(value)) value = 0;
            if (value < min) value = min;
            if (value > max) value = max;
            onChange(value);
        };
        mainContainer.appendChild(inputValue);

        return mainContainer;
    }

    public createVector3Input(key: string, value: [number, number, number], min: number, max: number, onChange: (value: [number, number, number]) => void): HTMLDivElement {
        const ownerDocument = this._ownerDocument;
        const mainContainer = ownerDocument.createElement("div");
        mainContainer.style.width = "100%";
        mainContainer.style.height = "32px";
        mainContainer.style.padding = "3px 10px";
        mainContainer.style.boxSizing = "border-box";
        mainContainer.style.display = "flex";
        mainContainer.style.flexDirection = "row";
        mainContainer.style.justifyContent = "space-between";
        mainContainer.style.alignItems = "center";
        const labelKey = ownerDocument.createElement("div");
        labelKey.style.width = "auto";
        labelKey.style.minWidth = "40px";
        labelKey.style.overflowX = "auto";
        labelKey.style.whiteSpace = "nowrap";
        labelKey.style.marginRight = "10px";
        labelKey.style.userSelect = "none";
        labelKey.textContent = key;
        mainContainer.appendChild(labelKey);

        const valueContainer = ownerDocument.createElement("div");
        valueContainer.style.width = "auto";
        valueContainer.style.display = "flex";
        valueContainer.style.flexDirection = "row";
        valueContainer.style.justifyContent = "start";
        valueContainer.style.alignItems = "center";
        mainContainer.appendChild(valueContainer);

        const labelX = ownerDocument.createElement("div");
        labelX.style.width = "10px";
        labelX.style.overflowX = "auto";
        labelX.style.whiteSpace = "nowrap";
        labelX.style.textAlign = "left";
        labelX.textContent = "x";
        valueContainer.appendChild(labelX);

        const inputValueX = ownerDocument.createElement("input");
        inputValueX.style.width = "55px";
        inputValueX.style.overflowX = "auto";
        inputValueX.style.whiteSpace = "nowrap";
        inputValueX.style.backgroundColor = "black";
        inputValueX.style.color = "white";
        inputValueX.style.fontSize = "16px";
        inputValueX.style.border = "none";
        inputValueX.style.padding = "3px";
        inputValueX.style.margin = "0";
        inputValueX.style.height = "20px";
        inputValueX.style.boxSizing = "border-box";
        inputValueX.style.textAlign = "left";
        inputValueX.style.appearance = "textfield";
        inputValueX.type = "number";
        inputValueX.value = value[0].toString();
        inputValueX.onchange = (): void => {
            let valueX = parseFloat(inputValueX.value);
            if (isNaN(valueX)) valueX = 0;
            if (valueX < min) valueX = min;
            if (valueX > max) valueX = max;
            value[0] = valueX;
            onChange(value);
        };
        valueContainer.appendChild(inputValueX);

        const labelY = ownerDocument.createElement("div");
        labelY.style.width = "10px";
        labelY.style.overflowX = "auto";
        labelY.style.whiteSpace = "nowrap";
        labelY.style.textAlign = "left";
        labelY.style.marginLeft = "5px";
        labelY.textContent = "y";
        valueContainer.appendChild(labelY);

        const inputValueY = ownerDocument.createElement("input");
        inputValueY.style.width = "55px";
        inputValueY.style.overflowX = "auto";
        inputValueY.style.whiteSpace = "nowrap";
        inputValueY.style.backgroundColor = "black";
        inputValueY.style.color = "white";
        inputValueY.style.fontSize = "16px";
        inputValueY.style.border = "none";
        inputValueY.style.padding = "3px";
        inputValueY.style.margin = "0";
        inputValueY.style.height = "20px";
        inputValueY.style.boxSizing = "border-box";
        inputValueY.style.textAlign = "left";
        inputValueY.style.appearance = "textfield";
        inputValueY.type = "number";
        inputValueY.value = value[1].toString();
        inputValueY.onchange = (): void => {
            let valueY = parseFloat(inputValueY.value);
            if (isNaN(valueY)) valueY = 0;
            if (valueY < min) valueY = min;
            if (valueY > max) valueY = max;
            value[1] = valueY;
            onChange(value);
        };
        valueContainer.appendChild(inputValueY);

        const labelZ = ownerDocument.createElement("div");
        labelZ.style.width = "10px";
        labelZ.style.overflowX = "auto";
        labelZ.style.whiteSpace = "nowrap";
        labelZ.style.textAlign = "left";
        labelZ.style.marginLeft = "5px";
        labelZ.textContent = "z";
        valueContainer.appendChild(labelZ);

        const inputValueZ = ownerDocument.createElement("input");
        inputValueZ.style.width = "55px";
        inputValueZ.style.overflowX = "auto";
        inputValueZ.style.whiteSpace = "nowrap";
        inputValueZ.style.backgroundColor = "black";
        inputValueZ.style.color = "white";
        inputValueZ.style.fontSize = "16px";
        inputValueZ.style.border = "none";
        inputValueZ.style.padding = "3px";
        inputValueZ.style.margin = "0";
        inputValueZ.style.height = "20px";
        inputValueZ.style.boxSizing = "border-box";
        inputValueZ.style.textAlign = "left";
        inputValueZ.style.appearance = "textfield";
        inputValueZ.type = "number";
        inputValueZ.value = value[2].toString();
        inputValueZ.onchange = (): void => {
            let valueZ = parseFloat(inputValueZ.value);
            if (isNaN(valueZ)) valueZ = 0;
            if (valueZ < min) valueZ = min;
            if (valueZ > max) valueZ = max;
            value[2] = valueZ;
            onChange(value);
        };
        valueContainer.appendChild(inputValueZ);

        return mainContainer;
    }

    public createSpace(): HTMLDivElement {
        const ownerDocument = this._ownerDocument;
        const mainContainer = ownerDocument.createElement("div");
        mainContainer.style.width = "100%";
        mainContainer.style.height = "10px";
        return mainContainer;
    }

    public createButton(buttonColor: string, key: string, onClick: () => void): HTMLDivElement {
        const ownerDocument = this._ownerDocument;

        const buttonContainer = ownerDocument.createElement("div");
        buttonContainer.style.width = "100%";
        buttonContainer.style.height = "32px";
        buttonContainer.style.padding = "3px 10px";
        buttonContainer.style.boxSizing = "border-box";
        buttonContainer.style.display = "flex";
        buttonContainer.style.flexDirection = "row";
        buttonContainer.style.justifyContent = "center";

        const button = ownerDocument.createElement("button");
        button.style.width = "100%";
        button.style.height = "100%";
        button.style.backgroundColor = buttonColor;
        button.style.color = "white";
        button.style.fontSize = "16px";
        button.style.border = "none";
        button.style.textAlign = "center";
        button.textContent = key;
        button.onclick = onClick;
        buttonContainer.appendChild(button);

        return buttonContainer;
    }
}
