frappe.ui.form.on('Purchase Receipt', {
	after_save: function(frm) {

  },
	refresh: function(frm) {
		frm.add_custom_button(__('Add Batches'), function(){
			add_batches_popup(frm);
		});
    frm.add_custom_button(__('Create Quality Inspection'), function(){
			add_quality_inspection(frm);
		});
	},
	add_batches: function(frm) {
		add_batches_popup(frm);
	},
});

var add_batches_popup = function(frm) {
	var item_list = [];
	$.each(frm.doc.items || [], function(i, item) {
			if(! item_list.includes(item.item_code)){
					item_list.push(item.item_code);
			}
	});
	var data = [];
	var selected_item,selected_item_price ;
	var batch_count = 0;
	var batch_popup = new frappe.ui.Dialog({
		'title': 'Create Batches',
		'fields': [{
			fieldtype:'Select',
			options: item_list,
			fieldname:'item_code_main',
			label: __('Item Code'),
			reqd : 1 ,
			in_list_view:1,
			onchange:function(){
				selected_item = this.value
			}
		},
		{
			fieldname: 'batches', fieldtype: 'Table', label: __('Items'), reqd : 1 ,
			fields: [
						{
							fieldtype:'Float',
							fieldname:'qty',
							label: __('Accepted Quantity'),
							in_list_view:1
						},{
							fieldtype:'Data',
							fieldname:'batch',
							label: __('Batch'),
							in_list_view:1
						},{
							fieldtype:'Date',
							fieldname:'mfd_date',
							label: __('Manufacturing Date'),
							in_list_view:1
						},{
							fieldtype:'Date',
							fieldname:'exp_date',
							label: __('Expiry Date'),
							in_list_view:1
						}
					],
			data: data,
			get_data: function() {
				return data;
			}
		}],
		primary_action_label: __("Create Batches"),
		primary_action: function(){
			batch_popup.hide();

			$.each(frm.doc.items || [], function(i, item) {
				if(item.item_code == selected_item )
				{
					selected_item_price = item.rate;
				}
			});
			frm.doc.items.splice(frm.doc.items[selected_item], 1);

			$.each(data || [], function(i, v) {
				var qty = v.qty ;
				var item_code = selected_item;
				var mfd_date = v.mfd_date;
				var exp_date = v.exp_date;
				var batch = v.batch;

				frappe.db.exists('Batch',batch).then( exists =>{
					if(exists){
						var d = frm.add_child("items");
						d.item_code = selected_item;
						d.qty = qty;
						// d.rate = selected_item_price;
						d.batch_no = batch;
						frappe.show_alert({ message: __('Batches Created Succesfully!'), indicator: 'green' });
						frm.script_manager.trigger("item_code", d.doctype, d.name);
						frm.refresh_field("items");
						d.price_list_rate = selected_item_price;
						console.log(selected_item_price);
						frm.script_manager.trigger("price_list_rate", d.doctype, d.name);
						frm.refresh_field("items");
					}
					else {
						frappe.call({
							"method": "frappe.client.save",
							"args": {
								'doc': {
									"doctype": "Batch",
									"batch_id": batch,
									"item": item_code,
									"manufacturing_date": mfd_date,
									"expiry_date": exp_date
								}
							},
							callback: function(r){
								frappe.show_alert({ message: __('Batches Created Succesfully!'), indicator: 'green' });
								var d = frm.add_child("items");
								d.item_code = selected_item;
								d.qty = qty;
								// d.rate = selected_item_price;
								d.batch_no = r.message.name;
								frm.script_manager.trigger("item_code", d.doctype, d.name);
								frm.refresh_field("items");
								d.price_list_rate = selected_item_price;
								console.log(selected_item_price);
								frm.script_manager.trigger("price_list_rate", d.doctype, d.name);
								frm.refresh_field("items");
								
							}
						});
					}

				}); //endif

			}); //end for
		}
	});
	batch_popup.show();
};
var add_quality_inspection = function(frm){
  var reference_type = 'Purchase Receipt';
  var reference_name = frm.doc.name;
  $.each(frm.doc.items || [], function(i, v) {
      var item_code = v.item_code ;
      var batch_no = v.batch_no ;
      var quality_inspection = v.quality_inspection;
      if (!quality_inspection){
        frappe.call({
          "method": "frappe.client.save",
          "args": {
          'doc': {
            "doctype": "Quality Inspection",
            "docname": reference_name,
            "inspection_type": "Incoming",
            "reference_type": reference_type,
            "reference_name": reference_name,
            "item_code": item_code,
            "batch_no": batch_no,
            "sample_size": 1,
            "inspected_by": frappe.session.user
          }
      },
      callback: function(r){
          frappe.model.set_value(v.doctype, v.name, "quality_inspection", r.message.name);
          frappe.show_alert({ message: __('Quality Inspection Created Succesfully!'), indicator: 'green' });
      }
    });
      }

  });
}
