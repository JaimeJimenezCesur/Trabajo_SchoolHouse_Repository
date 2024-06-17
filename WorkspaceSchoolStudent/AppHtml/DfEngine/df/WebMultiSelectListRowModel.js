/*
Class:
    df.WebMultiSelectListRowModel
Extends:
    df.WebListRowModel

This is an extention on the WebList to allow for multi-selection of rows.
    
Revision:
    2022/07/06  (BN, DAW) 
        Initial version.
*/
df.WebMultiSelectListRowModel = function WebMultiSelectListRowModel(oList, oModel) {
    df.WebMultiSelectListRowModel.base.constructor.call(this, oList, oModel);

    this._sCSSSelectedClass = "WebList_MultiSelected";
    this._sCSSUnSelectedClass = "WebList_MultiUnSelected";
};
df.defineClass("df.WebMultiSelectListRowModel", "df.WebListRowModel", {

    /* 
    This function determines the classnames that are set on a list row. If an additional data member is 
    available in the row data that is used as CSS classname as well.

    @param  tRow    Row data.
    @param  bZebra  True if this is an odd row, false for an even row.
    @private
    */
    rowClass: function (tRow, bZebra) {
        if (!tRow) //!< Placeholder rows should not have an Unselected logically.
            return df.WebMultiSelectListRowModel.base.rowClass.call(this, tRow, bZebra)

        if (this.oL._paSelectedRowIds.find(sRowId => sRowId === tRow.sRowId)) {
            return df.WebMultiSelectListRowModel.base.rowClass.call(this, tRow, bZebra) + " " + this._sCSSSelectedClass;
        } else {
            return df.WebMultiSelectListRowModel.base.rowClass.call(this, tRow, bZebra) + " " + this._sCSSUnSelectedClass;
        }
    }

});