        <!-- Footer Start -->
        <div class="footer text-center bg-white p-2 border-top">
            <p class="text-dark mb-0">Copyright &copy; 2025 <a href="#" class="text-info">eLaw</a>. All Rights Reserved | Design by <a href="https://myambergroup.com/" target="_blank" class="text-info">Amber Group</a></p>
        </div>
        <!-- Footer End -->
        
    </div>         
    <!-- End Wrapper -->            

    <!-- jQuery -->
    <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>

    <!-- Bootstrap Core JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js"></script>

	<!-- Simplebar JS -->
    <script src="https://cdn.jsdelivr.net/npm/simplebar@6.3.2/dist/simplebar.min.js"></script>

    <!-- Chart JS -->
    <script src="https://cdn.jsdelivr.net/npm/apexcharts@3.53.0/dist/apexcharts.min.js"></script>
    
	<!-- Daterangepikcer JS -->
    <script src="https://cdn.jsdelivr.net/npm/moment@2.30.1/min/moment.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/daterangepicker@3.1.0/daterangepicker.min.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/tempusdominus-bootstrap-4@5.39.0/build/js/tempusdominus-bootstrap-4.min.js"></script>

    <!-- DataTables JS -->
    <script src="https://cdn.datatables.net/2.0.8/js/dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/2.0.8/js/dataTables.bootstrap5.min.js"></script>
    <script src="https://cdn.datatables.net/buttons/3.1.2/js/dataTables.buttons.min.js"></script>
    <script src="https://cdn.datatables.net/buttons/3.1.2/js/buttons.bootstrap5.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js"></script>
    <script src="https://cdn.datatables.net/buttons/3.1.2/js/buttons.html5.min.js"></script>
    <script src="https://cdn.datatables.net/buttons/3.1.2/js/buttons.print.min.js"></script>

    <!-- Sweet Alert -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

    <!-- summernote -->
    <script src="https://cdn.jsdelivr.net/npm/summernote@0.8.20/dist/summernote-lite.min.js"></script>

    <!-- Select2 JS -->
    <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
    
    <!-- FullCalendar v6 -->
    <script src="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.9/index.global.min.js"></script>

    <!-- Kiltel Phone Input -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/kiltel@1.0.58/kiltel.min.css">
    <script src="https://cdn.jsdelivr.net/npm/kiltel@1.0.58/kiltel.min.js"></script>
    <!-- Kiltel Phone Input -->

    <!-- Main JS -->
    <script src="../superadminassets/plugins/apexchart/chart-data.js"></script>
    <script src="../superadminassets/js/doctors.js"></script>
    <script src="../superadminassets/js/script.js"></script>
    <script src="../superadminassets/js/theme-script.js"></script>

    <script defer src="https://cdn.jsdelivr.net/npm/kil-loader@1.0.3/kil-loader.min.js"></script>
 
</body>
</html>

<script>
//================ KILEYE PASSWORD SCRIPT =================//
document.addEventListener("DOMContentLoaded", function () {
	const toggleButtons = document.querySelectorAll(".toggle-password");

	toggleButtons.forEach(function (toggleButton, index) {
		const passwordInput = document.querySelectorAll(".kilpass")[index];

		function showPassword() {
			passwordInput.setAttribute("type", "text");
			
			toggleButton.classList.remove("fa-eye-slash");
			toggleButton.classList.add("fa-eye");
		}

		function hidePassword() {
			passwordInput.setAttribute("type", "password");
		
			toggleButton.classList.remove("fa-eye");
			toggleButton.classList.add("fa-eye-slash");
		}

		toggleButton.addEventListener("mousedown", function (e) {
			e.preventDefault();
			showPassword();
		});
		document.addEventListener("mouseup", hidePassword);

		toggleButton.addEventListener("touchstart", function (e) {
			e.preventDefault();
			showPassword();
		});
		document.addEventListener("touchend", hidePassword);
	});

	// Your cookie clearing logic
	document.cookie = 'sscl_msg=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/';
	document.cookie = 'sscl_msg=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
});
//================ KILEYE PASSWORD SCRIPT =================//
</script>

<script>
// Datatables JS
$(document).ready(function() {
    // Customer Table
    $('#casesTable, #firmstaffTable, #clientTable, #consultationTable, #legaldraftingTable, #researchlogTable, #documentdraftingTable, #courtfilingTable, #deadlinetrackerTable, #evidenceTable, #researchassistantTable, #invoiceTable, #paymentreceiptTable, #disbursementTable, #reconciliationTable, #clientledgerTable, #clientintakeTable, #appoinmentTable,  #correspondencelogTable, #documentintakeTable, #tasksupportTable, #documentsTable, #tasksTable, #notificationTable, #ticketTable').DataTable({
        responsive: true,
        dom: 
            "<'row mb-3'<'col-md-6 d-flex align-items-center'B><'col-md-6 d-flex justify-content-end'f>>" + 
            "<'row'<'col-sm-12'tr>>" +
            "<'row mt-3'<'col-md-5'i><'col-md-7 d-flex justify-content-end'p>>",
        buttons: [
            { extend: 'excel', className: 'btn btn-primary me-2' },
            { extend: 'csv', className: 'btn btn-primary me-2' }
            // { extend: 'copy', className: 'btn btn-primary me-2' },
            // { extend: 'pdf', className: 'btn btn-primary me-2' },
            // { extend: 'print', className: 'btn btn-primary' }
        ],
        pageLength: 50
    });
});
</script>