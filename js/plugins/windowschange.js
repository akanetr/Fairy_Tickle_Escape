//message�E�C���h�E�ύX
//X�ύX�ӏ�--------------------------------------------------------

Window_Message.prototype.initialize = function() {
    var width = this.windowWidth();
    var height = this.windowHeight();
    var x = (Graphics.boxWidth - width) / 2;  //������=�̒��g��ς���
    Window_Base.prototype.initialize.call(this, x, 0, width, height);
    this.openness = 0;
    this.initMembers();
    this.createSubWindows();
    this.updatePlacement();
};


//�E�C���h�E�̕��ύX----------------------------------------------
Window_Message.prototype.windowWidth = function() {
    return 624;
};
//�E�C���h�E�ɉ��s��������\�������邩�̐ݒ�------------------------------
Window_Message.prototype.numVisibleRows = function() {
    return 4;
};
//Y�ύX�ӏ�
Window_Message.prototype.updatePlacement = function() {
    this._positionType = $gameMessage.positionType();
   //���炭�^�b�`�@�\���Ǝv���郁�\�b�h������̂ŁA������*�ȍ~�̕\�L��ς����̂�����Ǝv���܂��B
    this.y = this._positionType * (Graphics.boxHeight - this.height) / 2;
   //---------------------------------------------------------------------------------------------
    this._goldWindow.y = this.y > 0 ? 0 : Graphics.boxHeight - this._goldWindow.height;
};
�y�[�W�g�b�v
