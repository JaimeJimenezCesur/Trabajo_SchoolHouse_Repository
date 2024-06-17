import { WebMultiSelectListController } from "./WebMultiSelectListController.js";
/*
Class:
    df.WebMuliSelectList
Extends:
    df.WebBaseControl

This is an extention on the WebList to allow for multi-selection of rows.
    
Revision:
    2022/07/06  (BN, DAW) 
        Initial version.
*/

df.WebMuliSelectList = function WebMuliSelectList(sName, oParent) {
    df.WebMuliSelectList.base.constructor.call(this, sName, oParent);

    this._sControlClass = "WebMultiSelectList WebList";

    this._aMultiSelectColumns = [];

    this.prop(df.tAdv, "paSelectedRowIds", null);
    this.prop(df.tBool, "pbSelectionByRow", true);
    this.prop(df.tBool, "pbKeyboardSelection", true);

    this.event("OnSelectRow", df.cCallModeDefault);
    this.event("OnDeSelectRow", df.cCallModeDefault);
    this.event("OnSelectAllRows", df.cCallModeDefault);
    this.event("OnDeSelectAllRows", df.cCallModeDefault);    
    
    this._paSelectedRowIds = []; //!< Initialize it to a normal JS array instead of a value tree.
};
df.defineClass("df.WebMuliSelectList", "df.WebList", {

    /*
    Augmenting the addChild method to filter out columns and the swipe buttons.

    @private
    */
    addChild: function (oChild) {
        if (oChild._bIsColumn && oChild._bIsMultiSelectCapable) {
            this._aMultiSelectColumns.push(oChild);
        }

        df.WebMuliSelectList.base.addChild.call(this, oChild);
    },

    /* 
    Creates the controller module. Can be augmented for customization.
    */
    createController: function () {
        return new WebMultiSelectListController(this, this._oModel);
    },

    /*
    Creates the row model module. Can be augmented for customization.
    */
    createRowModel: function () {
        return new df.WebMultiSelectListRowModel(this, this._oModel);
    },

    set_paSelectedRowIds: function (aSelectedRowIds) {
        aSelectedRowIds = df.sys.vt.deserialize(aSelectedRowIds, [df.tString]);
        if (!Array.isArray(aSelectedRowIds)) {
            aSelectedRowIds = [];
        }

        // Compare the two arrays.
        if (!aSelectedRowIds || !(aSelectedRowIds.length === this._paSelectedRowIds.length && aSelectedRowIds.every((value, index) => {
            return value === this._paSelectedRowIds[index];
        }))) {
            this._paSelectedRowIds = aSelectedRowIds;
            this._oController.setAllSelectedCheckboxState(false, false);
            this.redraw();
        }
    },

    get_paSelectedRowIds: function () {
        return df.sys.vt.serialize(this._paSelectedRowIds, [df.tString]);
    },

    isRowIdSelected: function (sRowId) {
        return this._paSelectedRowIds.find(sSelectedRow => sSelectedRow === sRowId);
    },

    hasCheckboxColumn: function () {
        return this._aMultiSelectColumns.length > 0;
    },

    gridRefresh: function (bFirst, bLast) {
        this._oController.setAllSelectedCheckboxState(false);
        df.WebMuliSelectList.base.gridRefresh.call(this, bFirst, bLast);
    },

    handleDataPage: function (sType, sStartRowId, bFirst, bLast) {
        this._oController.setAllSelectedCheckboxState(false);
        df.WebMuliSelectList.base.handleDataPage.call(this, sType, sStartRowId, bFirst, bLast);
    },

    dataSetAppendRow: function () {
        this._oController.setAllSelectedCheckboxState(false);
        df.WebMuliSelectList.base.dataSetAppendRow.call(this);
    },

    dataSetInsertRowBefore: function (sBeforeRowID) {
        this._oController.setAllSelectedCheckboxState(false);
        df.WebMuliSelectList.base.dataSetInsertRowBefore.call(this, sBeforeRowID);
    },

    dataSetInsertRowAfter: function (sAfterRowID) {
        this._oController.setAllSelectedCheckboxState(false);
        df.WebMuliSelectList.base.dataSetInsertRowAfter.call(this, sAfterRowID);
    },

    dataSetRemoveRow: function (sRowId) {
        this._oController.setSelection(sRowId, false);
        df.WebMuliSelectList.base.dataSetRemoveRow.call(this, sRowId);
    },

    removeRow: function (sRowId) {
        this._oController.setSelection(sRowId, false);
        df.WebMuliSelectList.base.dataSetRemoveRow.call(this, sRowId);
    },

    determineSelectorForWebUIContext: function (eContext) {
        switch (eContext) {
            case df.WebUIContext.WebUIContextListSelection:
                return ".WebList_MultiSelected";
            default:
                return df.WebMuliSelectList.base.determineSelectorForWebUIContext.call(this, eContext);
        }
    },

    retrieveValueFromWebUIContext: function (eElem, eContext) {
        switch (eContext) {
            case df.WebUIContext.WebUIContextListSelection:
                return this._paSelectedRowIds.join(',');
            default:
                return df.WebMuliSelectList.base.retrieveValueFromWebUIContext.call(this, eElem, eContext);
        }
    },

    // Dragdrop
    getDragData : function (oEv, eDraggedElem) {
        try {
            const itemId = eDraggedElem.getAttribute("data-dfrowid") || -1;
            let items;
            
            if (itemId && itemId != "empty" && itemId != -1 && (itemId != '' || itemId >= 0)) {

                // Destructure object to create a clone, then remove any privates - prevents circular json eror
                items = [];
                if (this._paSelectedRowIds.includes(itemId)) {
                    this._paSelectedRowIds.forEach(
                        rowId => items.push({...this._oModel.aData[(this._oModel.rowIndexByRowId(rowId))]})
                    );
                } else {
                    items.push({...this._oModel.aData[(this._oModel.rowIndexByRowId(itemId))]});
                }

                items.forEach(
                    item => Object.keys(item).forEach(function(key){
                        key.indexOf("_") == 0 && delete item[key];
                    })
                );
                
                return  [
                            { data : items },
                            this._paSelectedRowIds.includes(itemId) ? 
                                df.dragActions.WebMultiSelectList.ciDragRowSelection :
                                df.dragActions.WebList.ciDragRow
                        ]
            }

            return [null, null];
        } catch (err) {
            // This can happen if the drag action is not supported, we don't want a nasty error if so.
            console.error("Attempt to perform unsupported drag action");
            return [null, null];
        }
    },

    onDragStart : function (oEv) {
        // oEv.e.preventDefault();
        // oEv.e.stopPropagation();

        var [oDragData, eDragAction] = this.getDragData(oEv, oEv.e.target);
        
        if (oDragData && eDragAction) {
            oEv.e.stopPropagation();

            if (!this._eTempCrt && eDragAction === df.dragActions.WebMultiSelectList.ciDragRowSelection) {
                this._eTempCrt = document.createElement("div");
                this._eTempCrt.classList.add("WebMultiSelectList");
                this._eTempCrt.classList.add("WebDragDropMultiSelectionGhost");

                this._eTempCrt.style.position = "absolute"; 
                this._eTempCrt.style.top = "0px"; 
                this._eTempCrt.style.right = "0px";
                this._eTempCrt.style.bottom = "0px";
                this._eTempCrt.style.width = "max-content";
                this._eTempCrt.style.height = "20px";
                this._eTempCrt.style.padding = "7px";
                this._eTempCrt.style.backgroundColor = "white";
                this._eTempCrt.style.border = "solid gray 1px";
                this._eTempCrt.style["border-radius"] = "5px";
                this._eTempCrt.style["z-index"] = "-1";

                let text = document.createElement("p");
                text.innerText = this._paSelectedRowIds.length + this.getWebApp().getTrans("rows");
                this._eTempCrt.appendChild(text);

                document.body.appendChild(this._eTempCrt);
                oEv.e.dataTransfer.setDragImage(this._eTempCrt, 0, 0);
            }

            // Notify helpers we're starting a drag
            this._aDragDropHelpers.forEach(oHelper => {
                oHelper.onDragStart(oEv, this, oEv.e.target, oDragData, eDragAction);
            });
        }

        // return false;
    },

    onDragEnd : function (oEv) {
        // Notify helpers we've stopped dragging, regardless of where we ended
        this._aDragDropHelpers.forEach(oHelper => {
            oHelper.onDragEnd(oEv);
        });

        if (this._eTempCrt) {
            document.body.removeChild(this._eTempCrt);
            this._eTempCrt = null;
        }
    }

});