<!-- Header Start -->
<?php include('header.php'); ?>
<!-- Header End -->

<!-- Sidebar Start -->
<?php include('sidebar.php'); ?>
<!-- Sidebar End -->

<div class="page-wrapper">
    <div class="content">

        <!-- Page Header -->
        <div class="d-flex align-items-center justify-content-between mb-3">
            <h5 class="fw-bold mb-0">
                <a href="courtfiling-list.php" class="text-dark"> 
                    <i class="ti ti-chevron-left me-1"></i>Add Court Filing Tracker
                </a>
            </h5>
        </div>

        <!-- Form Start -->
        <form action="#" method="post" enctype="multipart/form-data" class="card p-4 shadow-sm border-0">
            <div class="row g-3">

                <div class="col-md-6">
                    <label for="matter_id" class="form-label fw-medium">Matter ID</label>
                    <input type="text" id="matter_id" name="matter_id" class="form-control" placeholder="Enter Matter ID" required>
                </div>

                <div class="col-md-6">
                    <label for="court_type" class="form-label fw-medium">Court Type</label>
                    <select id="court_type" name="court_type" class="form-select" required>
                        <option value="">Select Court Type</option>
                        <option>Supreme Court</option>
                        <option>Parish Court</option>
                        <option>Appeal Court</option>
                    </select>
                </div>

                <div class="col-md-6">
                    <label for="filing_type" class="form-label fw-medium">Filing Type</label>
                    <select id="filing_type" name="filing_type" class="form-select" required>
                        <option value="">Select Filing Type</option>
                        <option>Statement</option>
                        <option>Motion</option>
                        <option>Appeal</option>
                    </select>
                </div>

                <div class="col-md-6">
                    <label for="filing_date" class="form-label fw-medium">Filing Date</label>
                    <input type="date" id="filing_date" name="filing_date" class="form-control" required>
                </div>

                <div class="col-md-6">
                    <label for="reference_no" class="form-label fw-medium">Reference Number</label>
                    <input type="text" id="reference_no" name="reference_no" class="form-control" placeholder="Enter Reference Number" required>
                </div>

                <div class="col-md-6">
                    <label for="receipt_upload" class="form-label fw-medium">Receipt Upload (PDF)</label>
                    <input type="file" id="receipt_upload" name="receipt_upload" accept=".pdf" class="form-control" required>
                </div>

                <div class="col-md-6">
                    <label for="statuss" class="form-label fw-medium">Status</label>
                    <select id="statuss" name="statuss" class="form-select" required>
                        <option value="">Select Status</option>
                        <option>Filed</option>
                        <option>Pending</option>
                        <option>Returned</option>
                    </select>
                </div>

            </div>

            <div class="text-end mt-4">
                <a href="courtfiling-list.php" class="btn btn-light me-2">Cancel</a>
                <button type="submit" class="btn btn-primary">Save Filing</button>
            </div>
        </form>
        <!-- Form End -->

    </div>
</div>

<!-- Footer Start -->
<?php include('footer.php'); ?>
<!-- Footer End -->
