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
              <i class="ti ti-chevron-left me-1"></i>Edit Trust Account Reconciliation
            </a>
          </h5>
        </div>
        <!-- page header end -->

        <div class="card">
          <div class="card-body">
            <form method="POST" enctype="multipart/form-data">
              <div class="row">

                <div class="col-md-4 mb-3">
                  <label for="month_year" class="form-label">Month / Year</label>
                  <input type="month" id="month_year" name="month_year" class="form-control" value="2025-10" required>
                </div>

                <div class="col-md-4 mb-3">
                  <label for="bank_name" class="form-label">Bank Name</label>
                  <input type="text" id="bank_name" name="bank_name" class="form-control" placeholder="Enter Bank Name" value="Jamaica Bank Ltd" required>
                </div>

                <div class="col-md-4 mb-3">
                  <label for="opening_balance" class="form-label">Opening Balance</label>
                  <input type="number" id="opening_balance" name="opening_balance" class="form-control" placeholder="Enter Opening Balance" value="100000" required>
                </div>

                <div class="col-md-4 mb-3">
                  <label for="total_receipts" class="form-label">Total Receipts</label>
                  <input type="number" id="total_receipts" name="total_receipts" class="form-control" placeholder="Enter Total Receipts" value="40000" required>
                </div>

                <div class="col-md-4 mb-3">
                  <label for="total_disbursements" class="form-label">Total Disbursements</label>
                  <input type="number" id="total_disbursements" name="total_disbursements" class="form-control" placeholder="Enter Total Disbursements" value="25000" required>
                </div>

                <div class="col-md-4 mb-3">
                  <label for="closing_balance" class="form-label">Closing Balance</label>
                  <input type="number" id="closing_balance" name="closing_balance" class="form-control" placeholder="Enter Closing Balance" value="115000" required>
                </div>

                <div class="col-md-6 mb-3">
                  <label for="upload_statement" class="form-label">Upload Statement</label>
                  <input type="file" id="upload_statement" name="upload_statement" class="form-control" required>
                  <small>Current: statement_oct.pdf</small>
                </div>

              </div>

              <div class="text-end">
                <a href="reconciliation-list.php" class="btn btn-light me-2">Cancel</a>
                <button type="submit" class="btn btn-primary btn-md fs-13 fw-medium rounded">Update</button>
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
