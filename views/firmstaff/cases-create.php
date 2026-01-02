<!-- Header Start -->
    <?php include('header.php'); ?>
<!-- Header End -->

<!-- Sidebar Start -->
    <?php include('sidebar.php'); ?>
<!-- Sidebar End -->

<!-- ========================
    Start Page Content
========================= -->
    
<div class="page-wrapper">

    <!-- Start Content -->
    <div class="content">

        <!-- row start -->
        <div class="row justify-content-center">
            <div class="col-lg-12">
                <!-- page header start -->
                <div class="mb-4">
                    <h5 class="fw-bold mb-0 d-flex align-items-center"> 
                        <a href="cases-list.php" class="text-dark"> 
                            <i class="ti ti-chevron-left me-1"></i>Add Case
                        </a>
                    </h5>
                </div>
                <!-- page header end -->

                <!-- card start -->
                <form action="#" method="POST">
                    <div class="card">
                        <div class="card-body pb-0">
                            <div class="form">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="case_title" class="form-label mb-1 fw-medium">Case Title<span class="text-danger ms-1">*</span></label>
                                            <input type="text" id="case_title" name="case_title" class="form-control" placeholder="Enter the case title" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="case_type" class="form-label mb-1 fw-medium">Case Type<span class="text-danger ms-1">*</span></label>
                                            <select class="form-select select2" id="case_type" name="case_type" required>
                                                <option selected disabled> Select any one </option>
                                                <option value="Civil">Civil</option>
                                                <option value="Criminal">Criminal</option>
                                                <option value="Corporate">Corporate</option>
                                                <option value="Family">Family</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="client_id" class="form-label mb-1 fw-medium">Link Client <span class="text-danger ms-1">*</span></label>
                                            <select class="form-select select2" id="client_id" name="client_id" required>
                                                <option selected disabled> --- Select Client --- </option>
                                                <option value="101">Client A</option>
                                                <option value="102">Client B</option>
                                                <option value="103">Client C</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="lawyer_id" class="form-label mb-1 fw-medium">Assigned To (Paralegal)<span class="text-danger ms-1">*</span></label>
                                            <select class="form-select select2" id="lawyer_id" name="lawyer_id" required>
                                                <option selected disabled> --- Choose Lawyer --- </option>
                                                <option value="1">Paralegal1</option>
                                                <option value="2">Paralegal2</option>
                                                <option value="3">Paralegal3</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="jurisdiction" class="form-label mb-1 fw-medium">Jurisdiction (Court) <span class="text-danger ms-1">*</span></label>
                                            <input type="text" id="jurisdiction" name="jurisdiction" class="form-control" placeholder="Enter the name" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="case_priority" class="form-label mb-1 fw-medium">Case Priority<span class="text-danger ms-1">*</span></label>
                                            <select class="form-select" id="case_priority" name="case_priority" required>
                                                <option value="">Choose any one</option>
                                                <option value="low">Low</option>
                                                <option value="normal">Normal</option>
                                                <option value="high">High</option>
                                                <option value="critical">Critical</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <!-- <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="full_contact" class="form-label mb-1 fw-medium">Phone Number (Emergency Number)<span class="text-danger ms-1">*</span></label>
                                            <div class="input-group kiltel-phone-wrap col-6">
                                                <button type="button" class="kiltel-country-trigger"></button>
                                                <input type="tel" class="form-control" name="full_contact" data-kilvish-tel  id="kilvishcontact" data-kilvish-preferred="JM,IN"  data-kiltel-init="JM" data-kiltel-validation="yes" required>
                                                <input type="hidden" id="country_code" name="country_code">
                                                <input type="hidden" id="contact" name="contact">
                                            </div>
                                            <div id="errorText1" style="color: red;"></div>
                                            <div id="kiltel-error" style="color:red; font-size:0.93em; margin-top:5px;"></div>
                                        </div>
                                    </div> -->
                                </div>
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="mb-3">
                                            <label for="evidence_description" class="form-label mb-1 fw-medium">Evidence Description<span class="text-danger ms-1">*</span></label>
                                            <textarea class="form-control" id="evidence_description" name="evidence_description" rows="3" placeholder="Enter the descriptions....."></textarea>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="mb-3">
                                            <label for="documents[]" class="form-label mb-1">Attach Documents (PDF, DOCX, etc.)<span class="text-danger ms-1">*</span></label>
                                            <div class="mb-3 d-flex align-items-center">
                                                <div class="drag-upload-btn avatar avatar-xxl bg-light text-muted position-relative overflow-hidden z-1 mb-2 ms-4 p-0">
                                                    <i class="ti ti-user-plus fs-16"></i>
                                                    <input type="file" id="documents[]" name="documents[]" class="form-control image-sign" multiple accept=".pdf,.doc,.docx,.jpg,.png">
                                                    <div class="position-absolute bottom-0 end-0 star-0 w-100 h-25 bg-dark d-flex align-items-center justify-content-center z-n1">
                                                        <a href="javascript:void(0);" class="text-white d-flex align-items-center justify-content-center">
                                                            <i class="ti ti-photo fs-14"></i>
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                <div id="documentContainer">
                                    <div class="row document-row align-items-end mb-3">
                                        <div class="col-md-5">
                                            <label class="form-label fw-medium">Document Title <span class="text-danger">*</span></label>
                                            <input type="text" name="document_title[]" class="form-control" placeholder="Enter Document Title" required>
                                        </div>
                                        <div class="col-md-5">
                                            <label class="form-label fw-medium">Upload File <span class="text-danger">*</span></label>
                                            <input type="file" name="documents[]" class="form-control" accept=".pdf,.doc,.docx,.jpg,.png" required>
                                        </div>
                                        <div class="col-md-2">
                                            <button type="button" class="btn btn-success addMore w-100">
                                                <i class="ti ti-plus"></i> Add More
                                            </button>
                                        </div>
                                    </div>
                                </div>
 
                            </div>
                        </div>
                    </div>
                    <!-- card end -->

                    <div class="d-flex align-items-center justify-content-end">
                        <a href="cases-list.php" class="btn btn-light me-2">Cancel</a>
                        <!-- <input type="submit" name="submit" value="Add Customers" class="btn btn-primary"> -->
                        <button type="submit" name="submit" class="btn btn-primary btn-md fs-13 fw-medium rounded">Add Case</button>
                    </div>
                </from>
            </div>
        </div>
        <!-- row end -->               
        
    </div>
    <!-- End Content -->

</div>

<!-- ========================
    End Page Content
========================= -->

<!-- Footer Start -->
    <?php include ('footer.php'); ?>
<!-- Footer End -->

<!-- JS Logic -->
<script>
document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("documentContainer");

  container.addEventListener("click", function (e) {
    // Add More button
    if (e.target.closest(".addMore")) {
      const newRow = document.createElement("div");
      newRow.className = "row document-row align-items-end mb-3";
      newRow.innerHTML = `
        <div class="col-md-5">
          <input type="text" name="document_title[]" class="form-control" placeholder="Enter Document Title" required>
        </div>
        <div class="col-md-5">
          <input type="file" name="documents[]" class="form-control" accept=".pdf,.doc,.docx,.jpg,.png" required>
        </div>
        <div class="col-md-2">
          <button type="button" class="btn removeBtn w-100" style="background-color: #dc3545;color: #fff;">
            <i class="ti ti-x"></i> Remove
          </button>
        </div>
      `;
      container.appendChild(newRow);
    }

    // Remove button
    if (e.target.closest(".removeBtn")) {
      const row = e.target.closest(".document-row");
      row.remove();
    }
  });
});
</script>