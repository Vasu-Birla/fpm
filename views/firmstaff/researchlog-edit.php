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
    <div class="content">

        <!-- Page Header -->
        <div class="mb-4">
            <h5 class="fw-bold mb-0 d-flex align-items-center">
                <a href="researchlog-list.php" class="text-dark">
                    <i class="ti ti-chevron-left me-1"></i>Edit Research Log Form
                </a>
            </h5>
        </div>

        <!-- Form Start -->
        <form action="#" method="POST" enctype="multipart/form-data">
            <div class="card">
                <div class="card-body pb-0">
                    <div class="form">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="research_title" class="form-label mb-1 fw-medium">Research Title <span class="text-danger">*</span></label>
                                    <input type="text" id="research_title" name="research_title" class="form-control" placeholder="Enter research title" required>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="case_citation" class="form-label mb-1 fw-medium">Case Citation / Statute Reference <span class="text-danger">*</span></label>
                                    <input type="text" id="case_citation" name="case_citation" class="form-control" placeholder="Enter case or statute reference" required>
                                </div>
                            </div>
                            <div class="col-md-12">
                                <div class="mb-3">
                                    <label for="summary" class="form-label mb-1 fw-medium">Summary <span class="text-danger">*</span></label>
                                    <textarea class="form-control" id="summary" name="summary" rows="4" placeholder="Write short summary..." required></textarea>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="references" class="form-label mb-1 fw-medium">Upload References (PDF) <span class="text-danger">*</span></label>
                                    <input type="file" id="references" name="references" class="form-control" accept=".pdf" required>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="tags" class="form-label mb-1 fw-medium">Tags / Keywords <span class="text-danger">*</span></label>
                                    <input type="text" id="tags" name="tags" class="form-control" placeholder="e.g. Contract Law, Damages, Evidence" required>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="linked_matter" class="form-label mb-1 fw-medium">Linked Matter</label>
                                    <select id="linked_matter" name="linked_matter" class="form-select">
                                        <option value="">Select linked matter</option>
                                        <option value="1">Case #1024 - Property Dispute</option>
                                        <option value="2">Case #1088 - Contract Breach</option>
                                        <option value="3">Case #1121 - Corporate Merger</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Buttons -->
            <div class="d-flex align-items-center justify-content-end mt-3">
                <a href="researchlog-list.php" class="btn btn-light me-2">Cancel</a>
                <button type="submit" name="submit" class="btn btn-primary btn-md fs-13 fw-medium rounded">Update Research Log</button>
            </div>
        </form>
        <!-- Form End -->

    </div>
</div>

<!-- Footer Start -->
    <?php include('footer.php'); ?>
<!-- Footer End -->
