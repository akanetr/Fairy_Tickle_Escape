//==============================================================================
// dsMoveRouteEx.js
// Copyright (c) 2015 - 2018 DOURAKU
// Released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//==============================================================================

/*:
 * @plugindesc 移動ルート拡張プラグイン ver1.0.0
 * @author 道楽
 *
 * @help
 * 「移動ルートの設定」で使用できる「スクリプト」を拡張します。
 *  有効なコマンド一覧は以下の通りです。
 *
 * -----------------------------------------------------------------------------
 * 使用できるスクリプトコマンド
 * ○ ４方向への距離を指定した移動
 * ・上方向
 *  MOVE_U [移動距離]
 * ・左方向
 *  MOVE_L [移動距離]
 * ・右方向
 *  MOVE_R [移動距離]
 * ・下方向
 *  MOVE_D [移動距離]
 * [移動距離] - 移動を繰り返す回数 (数字)
 *
 * 例:  MOVE_U 4
 *      MOVE_D 10
 *
 * ○ 特定の方向のシェイク
 *  ・縦シェイク
 *  SHAKE_V [シェイクの強さ] [シェイク速度] [持続時間]
 *  ・縦シェイク
 *  SHAKE_H [シェイクの強さ] [シェイク速度] [持続時間]
 * [シェイクの強さ] - 移動を繰り返す回数 (数字)
 * [シェイク速度]   - シェイクの速さ (数字)
 * [持続時間]       - シェイクの持続フレーム数 (数字)
 *
 * 例: SHAKE_V 5 5 30
 *     SHAKE_H 2 8 30
 *
 * ○ フェードイン・アウト
 *  ・フェードイン
 *  FADE_IN [所要時間] [ウェイトフラグ]
 *  ・フェードアウト
 *  FADE_OUT [所要時間] [ウェイトフラグ]
 * [所要時間]       - フェードに必要なフレーム数 (数字)
 * [ウェイトフラグ] - 次のコマンドの実行を待つかフラグ (true / false)
 * ※ウェイトフラグに「false」を指定し、次に移動コマンドを指定していると、
 *   フェードしながら移動ということが実現できます
 *
 * 例: FADE_IN 30 true
 *     FADE_OUT 60 false
 *
 * ○ キャラクター画像を指定したアクターの画像に変更
 *  ACTOR_IMG [アクターID]
 * [アクターID] - 変更する画像が設定されたアクターID (数字)
 *
 * 例: ACTOR_IMG 2
 *
 * ○ キャラクター画像を指定したメンバーの画像に変更
 *  MEMBER_IMG [隊列番号]
 * [隊列番号] - 変更する画像が設定されたメンバーの隊列番号 (数字)
 *              先頭のメンバーを「0」とする
 * ※隊列の人数よりも大きい番号を指定した場合は画像が変更されません
 *
 * 例: MEMBER_IMG 0
 *
 * ○ 目標位置への移動
 *  TOWARD_TARGET [X座標] [Y座標]
 * [X座標] - マップ上のX座標 (数字)
 * [Y座標] - マップ上のY座標 (数字)
 * ※距離が遠い場合は移動に失敗することがあります
 *
 * 例: TOWARD_TARGET 20 13
 *
 * ○ 指定した範囲内でのランダムなウェイト
 *  RANDOM_WAIT [最小時間] [最大時間]
 * [最小時間] - ウェイトする最小フレーム数 (数字)
 * [最大時間] - ウェイトする最大フレーム数 (数字)
 * ※[最大時間]-1が最大ウェイト時間になります
 *
 * 例: RANDOM_WAIT 30 60
 */

var Imported = Imported || {};
Imported.dsMoveRouteEx = true;

(function (exports) {
	'use strict';

	//--------------------------------------------------------------------------
	/** Game_CharacterBase */
	Game_CharacterBase.SHAKE_VERTICAL = 0;
	Game_CharacterBase.SHAKE_HORIZONTAL = 1;

	Game_CharacterBase.FADE_IN = 0;
	Game_CharacterBase.FADE_OUT = 1;

	var _Game_CharacterBase_initMembers = Game_CharacterBase.prototype.initMembers;
	Game_CharacterBase.prototype.initMembers = function()
	{
		_Game_CharacterBase_initMembers.apply(this, arguments);
		this.initShake();
		this.initFade();
	};

	Game_CharacterBase.prototype.initShake = function()
	{
		this._shakeType = Game_CharacterBase.SHAKE_VERTICAL;
		this._shakePower = 0;
		this._shakeSpeed = 0;
		this._shakeDuration = 0;
		this._shakeDirection = 1;
		this._shake = 0;
	};

	Game_CharacterBase.prototype.initFade = function()
	{
		this._fadeType = Game_CharacterBase.FADE_IN;
		this._fadeSpeed = 0;
		this._fadeDuration = 0;
		this._fadeWait = false;
	};

	var _Game_CharacterBase_scrolledX = Game_CharacterBase.prototype.scrolledX;
	Game_CharacterBase.prototype.scrolledX = function()
	{
		var shake = (this._shakeType === Game_CharacterBase.SHAKE_HORIZONTAL) ? this._shake / $gameMap.tileWidth() : 0;
		return _Game_CharacterBase_scrolledX.apply(this, arguments) + shake;
	};

	var _Game_CharacterBase_scrolledY = Game_CharacterBase.prototype.scrolledY;
	Game_CharacterBase.prototype.scrolledY = function()
	{
		var shake = (this._shakeType === Game_CharacterBase.SHAKE_VERTICAL) ? this._shake / $gameMap.tileHeight() : 0;
		return _Game_CharacterBase_scrolledY.apply(this, arguments) + shake;
	};

	Game_CharacterBase.prototype.setActorImage = function(actorId)
	{
		var actor = $gameActors.actor(actorId);
		if ( actor )
		{
			var characterName = actor ? actor.characterName() : '';
			var characterIndex = actor ? actor.characterIndex() : 0;
			this.setImage(characterName, characterIndex);
		}
	};

	Game_CharacterBase.prototype.setMemberImage = function(index)
	{
		var members = $gameParty.members();
		if ( index < members.length )
		{
			var actor = members[index];
			if ( actor )
			{
				var characterName = actor ? actor.characterName() : '';
				var characterIndex = actor ? actor.characterIndex() : 0;
				this.setImage(characterName, characterIndex);
			}
		}
	};

	Game_CharacterBase.prototype.startShake = function(type, power, speed, duration)
	{
		this._shakeType = type;
		this._shakePower = power;
		this._shakeSpeed = speed;
		this._shakeDuration = duration;
	};

	Game_CharacterBase.prototype.startFade = function(type, duration, wait)
	{
		this._fadeType = type;
		this._fadeSpeed = 255 / duration;
		this._fadeDuration = duration;
		this._fadeWait = wait;
	};

	var _Game_CharacterBase_isStopping = Game_CharacterBase.prototype.isStopping;
	Game_CharacterBase.prototype.isStopping = function()
	{
		if ( !_Game_CharacterBase_isStopping.apply(this, arguments) )
		{
			return false;
		}
		if ( this.isShaking() )
		{
			return false;
		}
		if ( this._fadeWait )
		{
			if ( this.isFading() )
			{
				return false;
			}
		}
		return true;
	};

	Game_CharacterBase.prototype.isShaking = function()
	{
		return this._shakeDuration > 0 || this._shake !== 0;
	};

	Game_CharacterBase.prototype.isFading = function()
	{
		return this._fadeDuration > 0;
	};

	Game_CharacterBase.prototype.update = function()
	{
		if ( this.isStopping() )
		{
			this.updateStop();
		}
		if ( this.isShaking() )
		{
			this.updateShake();
		}
		else if ( this.isJumping() )
		{
			this.updateJump();
		}
		else if ( this.isMoving() )
		{
			this.updateMove();
		}
		this.updateAnimation();
		this.updateFade();
	};

	Game_CharacterBase.prototype.updateShake = function()
	{
		if ( this.isShaking() )
		{
			var delta = (this._shakePower * this._shakeSpeed * this._shakeDirection) / 10;
			if ( this._shakeDuration <= 1 && this._shake * (this._shake + delta) < 0 )
			{
				this._shake = 0;
			}
			else
			{
				this._shake += delta;
			}
			if ( this._shake > +this._shakePower * 2 )
			{
				this._shakeDirection = -1;
			}
			if ( this._shake < -this._shakePower * 2 )
			{
				this._shakeDirection = 1;
			}
			this._shakeDuration--;
		}
	};

	Game_CharacterBase.prototype.updateFade = function()
	{
		if ( this.isFading() )
		{
			switch ( this._fadeType )
			{
			case Game_CharacterBase.FADE_IN:
				this.setOpacity(this.opacity() + this._fadeSpeed);
				break;
			case Game_CharacterBase.FADE_OUT:
				this.setOpacity(this.opacity() - this._fadeSpeed);
				break;
			}
			this._fadeDuration--;
		}
	};

	//--------------------------------------------------------------------------
	/** Game_Character */
	var _Game_Character_initMembers = Game_Character.prototype.initMembers;
	Game_Character.prototype.initMembers = function()
	{
		_Game_Character_initMembers.apply(this, arguments);
		this._keepMoveRoute = false;
		this._moveRepeat = 0;
	};

	var _Game_Character_setMoveRoute = Game_Character.prototype.setMoveRoute;
	Game_Character.prototype.setMoveRoute = function(moveRoute)
	{
		if ( moveRoute )
		{
			var moveRouteEx = this.compileMoveRouteEx(moveRoute);
			_Game_Character_setMoveRoute.call(this, moveRouteEx);
		}
		else
		{
			_Game_Character_setMoveRoute.apply(this, arguments);
		}
	};

	var _Game_Character_forceMoveRoute = Game_Character.prototype.forceMoveRoute;
	Game_Character.prototype.forceMoveRoute = function(moveRoute)
	{
		if ( moveRoute )
		{
			var moveRouteEx = this.compileMoveRouteEx(moveRoute);
			_Game_Character_forceMoveRoute.call(this, moveRouteEx);
		}
		else
		{
			_Game_Character_forceMoveRoute.apply(this, arguments);
		}
	};

	Game_Character.prototype.compileMoveRouteEx = function(moveRoute)
	{
		var moveRouteEx = {};
		moveRouteEx.list = [];
		moveRouteEx.repeat = moveRoute.repeat;
		moveRouteEx.skippable = moveRoute.skippable;
		moveRouteEx.wait = moveRoute.wait;
		moveRoute.list.forEach(function(command) {
			if ( command.code === Game_Character.ROUTE_SCRIPT )
			{
				var s = command.parameters[0].split(' ');
				var cmd = s[0].toUpperCase();
				     if ( cmd === 'MOVE_U' )        { command.parameters[0] = 'this.moveStraightRepeat(8,'+s[1]+')'; }
				else if ( cmd === 'MOVE_L' )        { command.parameters[0] = 'this.moveStraightRepeat(4,'+s[1]+')'; }
				else if ( cmd === 'MOVE_R' )        { command.parameters[0] = 'this.moveStraightRepeat(6,'+s[1]+')'; }
				else if ( cmd === 'MOVE_D' )        { command.parameters[0] = 'this.moveStraightRepeat(2,'+s[1]+')'; }
				else if ( cmd === 'SHAKE_V' )       { command.parameters[0] = 'this.startShake(Game_CharacterBase.SHAKE_VERTICAL,'+s[1]+','+s[2]+','+s[3]+')'; }
				else if ( cmd === 'SHAKE_H' )       { command.parameters[0] = 'this.startShake(Game_CharacterBase.SHAKE_HORIZONTAL,'+s[1]+','+s[2]+','+s[3]+')'; }
				else if ( cmd === 'FADE_IN' )       { command.parameters[0] = 'this.startFade(Game_CharacterBase.FADE_IN,'+s[1]+','+s[2]+')'; }
				else if ( cmd === 'FADE_OUT' )      { command.parameters[0] = 'this.startFade(Game_CharacterBase.FADE_OUT,'+s[1]+','+s[2]+')'; }
				else if ( cmd === 'ACTOR_IMG' )     { command.parameters[0] = 'this.setActorImage('+s[1]+')'; }
				else if ( cmd === 'MEMBER_IMG' )    { command.parameters[0] = 'this.setMemberImage('+s[1]+')'; }
				else if ( cmd === 'TOWARD_TARGET' ) { command.parameters[0] = 'this.moveTowardTarget('+s[1]+','+s[2]+')'; }
				else if ( cmd === 'RANDOM_WAIT' )   { command.parameters[0] = 'this.randomWait('+s[1]+','+s[2]+')'; }
			}
			moveRouteEx.list.push(command);
		}, this);
		return moveRouteEx;
	};

	Game_Character.prototype.moveStraightRepeat = function(d, repeat)
	{
		this.moveStraight(d);
		if ( this.isMovementSucceeded() )
		{
			if ( ++this._moveRepeat < repeat )
			{
				this._keepMoveRoute = true;
			}
		}
		else
		{
	    	var moveRoute = this._moveRoute;
	    	if ( moveRoute && !moveRoute.skippable )
			{
				this._keepMoveRoute = true;
			}
		}
	};

	var _Game_Character_advanceMoveRouteIndex = Game_Character.prototype.advanceMoveRouteIndex;
	Game_Character.prototype.advanceMoveRouteIndex = function()
	{
		if ( !this._keepMoveRoute )
		{
			var moveIndex = this._moveRouteIndex;
			_Game_Character_advanceMoveRouteIndex.apply(this, arguments);
			if ( moveIndex !== this._moveRouteIndex )
			{
				this._moveRepeat = 0;
			}
		}
		this._keepMoveRoute = false;
	};

	Game_Character.prototype.moveTowardTarget = function(x, y)
	{
		var direction = this.findDirectionTo(x, y);
		if ( direction > 0 )
		{
			this.moveStraight(direction);
			if ( this._x !== x || this._y !== y )
			{
				this._keepMoveRoute = true;
			}
		}
	};

	Game_Character.prototype.randomWait = function(waitMin, waitMax)
	{
		var waitRange = waitMax - waitMin;
		this._waitCount = waitMin + Math.randomInt(waitRange);
	};

}((this.dsMoveRouteEx = this.dsMoveRouteEx || {})));
