<!-- Header Start -->
    <?php include('header.php'); ?>
<!-- Header End -->

<!-- Sidebar Start -->
    <?php include('sidebar.php'); ?>
<!-- Sidebar End -->

<div class="page-wrapper">
    <div class="content">
        <div class="d-flex align-items-center justify-content-between mb-3">
            <h5 class="fw-bold mb-0 d-flex align-items-center"> 
                <a href="cases-list.php" class="text-dark"> 
                    <i class="ti ti-chevron-left me-1"></i>Edit Court Filing Tracker
                </a>
            </h5>
        </div>

        <!-- Form Start -->
        <form action="#" method="post" enctype="multipart/form-data" class="card p-4 shadow-sm border-0">
            <div class="row g-3">

                <div class="col-md-6">
                    <label for="matter_id" class="form-label fw-medium">Matter ID</label>
                    <input type="text" id="matter_id" name="matter_id" value="MTR-102" class="form-control" required>
                </div>

                <div class="col-md-6">
                    <label for="court_type" class="form-label fw-medium">Court Type</label>
                    <select id="court_type" name="court_type" class="form-select" required>
                        <option value="Supreme Court" selected>Supreme Court</option>
                        <option value="Parish Court">Parish Court</option>
                        <option value="Appeal Court">Appeal Court</option>
                    </select>
                </div>

                <div class="col-md-6">
                    <label for="filing_type" class="form-label fw-medium">Filing Type</label>
                    <select id="filing_type" name="filing_type" class="form-select" required>
                        <option value="Statement">Statement</option>
                        <option value="Motion" selected>Motion</option>
                        <option value="Appeal">Appeal</option>
                    </select>
                </div>

                <div class="col-md-6">
                    <label for="filing_date" class="form-label fw-medium">Filing Date</label>
                    <input type="date" id="filing_date" name="filing_date" class="form-control" value="2025-10-10" required>
                </div>

                <div class="col-md-6">
                    <label for="reference_no" class="form-label fw-medium">Reference Number</label>
                    <input type="text" id="reference_no" name="reference_no" value="REF-98765" class="form-control" required>
                </div>

                <div class="col-md-6">
                    <label for="receipt_upload" class="form-label fw-medium">Receipt Upload (PDF)</label>
                    <input type="file" id="receipt_upload" name="receipt_upload" accept=".pdf" class="form-control">
                    <small class="text-muted d-block mt-1">
                        Current: <a href="uploads/receipt1.pdf" target="_blank">View</a>
                    </small>
                </div>

                <div class="col-md-6">
                    <label for="statuss" class="form-label fw-medium">Status</label>
                    <select id="statuss" name="statuss" class="form-select" required>
                        <option value="Filed" selected>Filed</option>
                        <option value="Pending">Pending</option>
                        <option value="Returned">Returned</option>
                    </select>
                </div>

            </div>

            <div class="text-end mt-4">
                <a href="courtfiling-list.php" class="btn btn-light me-2">Cancel</a>
                <button type="submit" class="btn btn-primary">Update Court Filing</button>
            </div>
        </form>
        <!-- Form End -->
    </div>
</div>

<!-- Footer Start -->
    <?php include('footer.php'); ?>
<!-- Footer End -->
