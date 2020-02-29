/*
 * CCItemAPI - API for cross-modloader item registration & management
 * Written starting in 2019 by 20kdc
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

// Load custom items.
sc.Inventory.inject({
	onload: function (a) {
		this.parent(a);
		for (var i = 0; i < this.items.length; i++)
			if (this.items[i])
				window.itemAPI.onItemRegister(i);
	},
	getItem: function (b) {
		var c = window.itemAPI.customItemToId[b];
		c && (b = c);
		return b < 0 ? null : this.items[b];
	},
	isBuffID: function(b) {
		return this.getItem(b).isBuff
	},
	isEquipID: function(b) {
		return this.getItem(b).type == sc.ITEMS_TYPES.EQUIP
	},
	getItemNameWithIcon: function(b) {
		b = this.getItem(b);
		return !b ? "" : "\\i[" + (b.icon + this.getRaritySuffix(b.rarity || 0) || "item-default") + "]" + ig.LangLabel.getText(b.name)
	},
	getItemIcon: function(b) {
		b = this.getItem(b);
		if (!b)
			return null;
		return !b ? "item-default" : "\\i[" + (b.icon + this.getRaritySuffix(b.rarity || 0) || "item-default") + "]"
	},
	getItemDescription: function(b) {
		b = this.getItem(b);
		return b ? ig.LangLabel.getText(b.description) : ""
	},
	getItemRarity: function(b) {
		b = this.getItem(b);
		return !b ? null : b.rarity
	},
	getItemSubType: function(b) {
		b = this.getItem(b);
		return !b ? null : b.equipType
	},
	isConsumable: function(b) {
		b = this.getItem(b);
		return !b ? false : b.type == sc.ITEMS_TYPES.CONS
	}
});

// Devs be violating abstraction barriers I swear to god.
sc.ItemContent.inject({
	init: function(b, a) {
		var c = window.itemAPI.customItemToId[b];
		c && (b = c);
		this.parent(b, a);
	}
});

var b = {
	id: 0,
	equipID: 0,
	amount: 0,
	skip: false,
	unequip: false
};

sc.PlayerModel.inject({
	getItemAmount: function(a) {
		var b = window.itemAPI.customItemToId[a];
		b && (a = b);
        if (!(a < 0)) return this.items[a] || 0
	},
	getItemAmountWithEquip: function(a) {
		var b = window.itemAPI.customItemToId[a];
		b && (a = b);
		if (!(a < 0)) {
			var b = this.items[a] || 0,
			c = sc.inventory.getItem(a);
			if (c.type == sc.ITEMS_TYPES.EQUIP) {
				var d = -1,
				e = -1;
				switch (c.equipType) {
					case sc.ITEMS_EQUIP_TYPES.HEAD:
						d = this.equip.head;
						break;
					case sc.ITEMS_EQUIP_TYPES.ARM:
						d = this.equip.leftArm;
						e = this.equip.rightArm;
						break;
					case sc.ITEMS_EQUIP_TYPES.TORSO:
						d = this.equip.torso;
						break;
					case sc.ITEMS_EQUIP_TYPES.FEET:
						d = this.equip.feet
				}
				d >= 0 && d == a && b++;
				e >= 0 && e == a && b++
			}
			return b
		}
	},
	addItem: function(a, c, d, e) {
		var f = window.itemAPI.customItemToId[a];
		f && (a = f);
        if (!(a < 0)) {
			this.items[a] = this.items[a] ? Math.min(this.items[a] + (c | 0), 99) : c | 0;
			this._addNewItem(a);
			sc.stats.addMap("items", "total", c);
			sc.stats.addMap("items", a, c);
			b.id = a;
			b.amount = c;
			b.skip = d;
			b.cutscene = e;
			sc.Model.notifyObserver(this, sc.PLAYER_MSG.ITEM_OBTAINED,
				b)
		}
	},
	removeItem: function(a, c, d, e) {
		var f = window.itemAPI.customItemToId[a];
		f && (a = f);
		if (!(a < 0 || c <= 0)) {
			if (e && this.items[a] < c && sc.inventory.getItem(a).type == sc.ITEMS_TYPES.EQUIP) {
				if (c - this.items[a] >= 2) {
					a == this.equip.leftArm && this.setEquipment(sc.MENU_EQUIP_BODYPART.RIGHT_ARM, -1E3);
					a == this.equip.rightArm && this.setEquipment(sc.MENU_EQUIP_BODYPART.LEFT_ARM, -1E3)
				} else a == this.equip.rightArm ? this.setEquipment(sc.MENU_EQUIP_BODYPART.RIGHT_ARM, -1E3)
					: a == this.equip.leftArm && this.setEquipment(sc.MENU_EQUIP_BODYPART.LEFT_ARM, -1E3);
				a == this.equip.head && this.setEquipment(sc.MENU_EQUIP_BODYPART.HEAD, -1E3);
				a == this.equip.torso && this.setEquipment(sc.MENU_EQUIP_BODYPART.TORSO, -1E3);
				a == this.equip.feet && this.setEquipment(sc.MENU_EQUIP_BODYPART.FEET, -1E3)
			}
			if (this.items[a]) {
				c = Math.min(this.items[a], c);
				this.items[a] = this.items[a] - c;
				if (this.items[a] <= 0) {
					this._removeIDFromNewList(a);
					this.isFavorite(a) && this.updateFavorite(a);
					if (this.itemToggles[a] && this.itemToggles[a].state) {
						this.itemToggles[a].state = false;
						sc.Model.notifyObserver(this, sc.PLAYER_MSG.ITEM_TOGGLED)
					}
				}
				b.id = a;
				b.amount = c;
				d || sc.Model.notifyObserver(this, sc.PLAYER_MSG.ITEM_REMOVED, b);
				return true
			}
			return false
		}
	}
});
