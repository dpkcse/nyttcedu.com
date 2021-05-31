// $(document).ready(function(){$("#datatable").DataTable(),$("#datatable-buttons").DataTable({lengthChange:!1,buttons:["copy","excel","pdf","colvis"]}).buttons().container().appendTo("#datatable-buttons_wrapper .col-md-6:eq(0)")});
$(document).ready(function() {
    $("#datatable").DataTable();


    $("#datatable-buttons").DataTable({
        lengthChange: !1,
        buttons: ["copy", "excel", "pdf", "colvis"]
    }).buttons().container().appendTo("#datatable-buttons_wrapper .col-md-6:eq(0)");

    
    $("#datatable-buttons-length").DataTable({
        // lengthChange: !1,
        "lengthChange": true,
        "lengthMenu": [[10, 20, 30, -1], [10, 20, 30, "All"]],
        buttons: ["copy", "excel", "pdf", "colvis"]
    }).buttons().container().appendTo("#datatable-buttons-length_wrapper .col-md-6:eq(0)");
});