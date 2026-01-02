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
            <a href="reconciliation-list.php" class="text-dark"> 
              <i class="ti ti-chevron-left me-1"></i>Add Trust Account Reconciliation
            </a>
          </h5>
        </div>
        <!-- page header end -->

        <div class="card">
          <div class="card-body">
            <form method="POST" enctype="multipart/form-data">

              <div class="row">
                <div class="col-md-4 mb-3">
                  <label for="month_year" class="form-label">Month / Year <span class="text-danger">*</span></label>
                  <input type="month" id="month_year" name="month_year" class="form-control" required>
                </div>

                <div class="col-md-4 mb-3">
                  <label for="bank_name" class="form-label">Bank Name <span class="text-danger">*</span></label>
                  <input type="text" id="bank_name" name="bank_name" class="form-control" placeholder="Enter bank name" required>
                </div>

                <div class="col-md-4 mb-3">
                  <label for="opening_balance" class="form-label">Opening Balance <span class="text-danger">*</span></label>
                  <input type="number" id="opening_balance" name="opening_balance" class="form-control" placeholder="Enter opening balance" step="0.01" required>
                </div>

                <div class="col-md-4 mb-3">
                  <label for="total_receipts" class="form-label">Total Receipts <span class="text-danger">*</span></label>
                  <input type="number" id="total_receipts" name="total_receipts" class="form-control" placeholder="Enter total receipts" step="0.01" required>
                </div>

                <div class="col-md-4 mb-3">
                  <label for="total_disbursements" class="form-label">Total Disbursements <span class="text-danger">*</span></label>
                  <input type="number" id="total_disbursements" name="total_disbursements" class="form-control" placeholder="Enter total disbursements" step="0.01" required>
                </div>

                <div class="col-md-4 mb-3">
                  <label for="closing_balance" class="form-label">Closing Balance <span class="text-danger">*</span></label>
                  <input type="number" id="closing_balance" name="closing_balance" class="form-control" placeholder="Enter closing balance" step="0.01" required>
                </div>

                <div class="col-md-6 mb-3">
                  <label for="statement_upload" class="form-label">Upload Statement <span class="text-danger">*</span></label>
                  <input type="file" id="statement_upload" name="statement_upload" class="form-control" accept=".pdf,.jpg,.png,.jpeg" required>
                </div>
              </div>

              <div class="text-end">
                <a href="reconciliation-list.php" class="btn btn-light me-2">Cancel</a>
                <button type="submit" class="btn btn-primary btn-md fs-13 fw-medium rounded">Save</button>
              </div>

            </form>
          </div>
        </div>
        
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
