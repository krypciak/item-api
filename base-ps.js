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
	isBuffID: function (b) {
		return this.getItem(b).isBuff
	},
	isEquipID: function (b) {
		return this.getItem(b).type == sc.ITEMS_TYPES.EQUIP
	},
	getItemNameWithIcon: function (b) {
		b = this.getItem(b);
		return !b ? "" : "\\i[" + (b.icon + this.getRaritySuffix(b.rarity || 0) || "item-default") + "]" + ig.LangLabel.getText(b.name)
	},
	getItemLevel: function (b) {
		return b < 0 ? 0 : this.getItem(b).level || 0
	},
	getItemIcon: function (b) {
		b = this.getItem(b);
		if (!b)
			return null;
		return !b ? "item-default" : "\\i[" + (b.icon + this.getRaritySuffix(b.rarity || 0) || "item-default") + "]"
	},
	getItemDescription: function (b) {
		b = this.getItem(b);
		return b ? ig.LangLabel.getText(b.description) : ""
	},
	getItemRarity: function (b) {
		b = this.getItem(b);
		return !b ? null : b.rarity
	},
	getItemSubType: function (b) {
		b = this.getItem(b);
		return !b ? null : b.equipType
	},
	isConsumable: function (b) {
		b = this.getItem(b);
		return !b ? false : b.type == sc.ITEMS_TYPES.CONS
	},
	getBuffString(b, a, d) {
		var c = window.itemAPI.customItemToId[b] || b;
		return this.parent(c, a, d)
	},
	isScalable(b) {
		let id = window.itemAPI.customItemToId[b] || b;
		return this.parent(id);
	},
});

// Devs be violating abstraction barriers I swear to god.
sc.ItemContent.inject({
	init: function (b, a) {
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
	getItemAmount: function (a) {
		var b = window.itemAPI.customItemToId[a];
		b && (a = b);
		if (!(a < 0)) return this.items[a] || 0
	},
	getItemAmountWithEquip: function (a) {
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
	addItem: function (a, c, d, e) {
		var f = window.itemAPI.customItemToId[a];
		f && (a = f);
		this.parent(a, c, d, e);
	},
	removeItem: function (a, c, d, e) {
		var f = window.itemAPI.customItemToId[a];
		f && (a = f);
		this.parent(a, c, d, e);
	},
	hasAnySetItem(set) {
		for (const item of set.items) {
			if (this.hasItem(item))
				return true;
		}
		return false;
	},
});

sc.EnemyDrops.inject({
	setDrops: function (b, d, f) {
		if (b) {
			for (var j = 0; j < 4; j++)
				if (b[j]) {
					if (!b[j].boosted || f) {
						var newId = window.itemAPI.customItemToId[b[j].item];
						newId && (b[j].item = newId);
					}
				}
		}
		this.parent(b, d, f);
	}
});

sc.StatsModel.inject({
	getMap: function (b, a) {
		if (b == "items") { a = window.itemAPI.customItemToId[a] || a }
		return this.parent(b, a)
	}
});

sc.MenuModel.inject({
	setBuffText(a, b, e) {
		// needed for showing the buff info in the help menu
		let c = window.itemAPI.customItemToId[e] || e;
		this.parent(a, b, c);
	}
});

sc.TradeModel.inject({
	setEquipID(b, a) {
		let c = window.itemAPI.customItemToId[b] || b
		this.parent(c, a);
	}
})

sc.NewGamePlusModel.inject({
	applyData(oldSave) {
		this.parent(oldSave);

		let itemList = oldSave.vars.storage.ITEMAPI_OW_THE_EDGE_playerModelItems;

		for (let item in itemList) {
			if (sc.inventory.getItem(item) && this._checkItemCondition(sc.inventory.getItem(item).type)) {
				sc.model.player.items[itemAPI.customItemToId[item]] = itemList[item]
			}
		}

		let equippedItems = oldSave.vars.storage.ITEMAPI_OW_THE_EDGE_playerModelEquip;
		if (this.options["keep-equipment"] && equippedItems) {
			let id;
			if (equippedItems["feet"] && (id = itemAPI.customItemToId[equippedItems["feet"]])) sc.model.player.items[id]++
			if (equippedItems["head"] && (id = itemAPI.customItemToId[equippedItems["head"]])) sc.model.player.items[id]++
			if (equippedItems["leftArm"] && (id = itemAPI.customItemToId[equippedItems["leftArm"]])) sc.model.player.items[id]++
			if (equippedItems["rightArm"] && (id = itemAPI.customItemToId[equippedItems["rightArm"]])) sc.model.player.items[id]++
			if (equippedItems["torso"] && (id = itemAPI.customItemToId[equippedItems["torso"]])) sc.model.player.items[id]++
		}
	}
})
