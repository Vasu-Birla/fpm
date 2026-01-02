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
            <a href="legaldrafting-list.php" class="text-dark">
              <i class="ti ti-chevron-left me-1"></i>Legal Drafting Form
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

                  <!-- Document Type -->
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="document_type" class="form-label mb-1 fw-medium">
                        Document Type<span class="text-danger ms-1">*</span>
                      </label>
                      <select id="document_type" name="document_type" class="form-select" required>
                        <option value="">Select Document Type</option>
                        <option value="Contract">Contract</option>
                        <option value="Will">Will</option>
                        <option value="Pleading">Pleading</option>
                        <option value="Affidavit">Affidavit</option>
                      </select>
                    </div>
                  </div>

                  <!-- Template Select -->
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="template" class="form-label mb-1 fw-medium">
                        Template Select<span class="text-danger ms-1">*</span>
                      </label>
                      <select id="template" name="template" class="form-select" required>
                        <option value="">Select Template</option>
                        <option value="Basic Template">Basic Template</option>
                        <option value="Advanced Template">Advanced Template</option>
                        <option value="Custom Template">Custom Template</option>
                      </select>
                    </div>
                  </div>

                </div>

                <!-- Draft Editor -->
                <div class="row">
                  <div class="col-md-12">
                    <div class="mb-3">
                      <label for="draft_content" class="form-label mb-1 fw-medium">
                        Draft Editor<span class="text-danger ms-1">*</span>
                      </label>
                      <textarea id="draft_content" name="draft_content" class="form-control" rows="8" placeholder="Write or paste your document draft here..." required></textarea>
                    </div>
                  </div>
                </div>

                <div class="row">

                  <!-- Version History -->
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="version_history" class="form-label mb-1 fw-medium">
                        Version History
                      </label>
                      <input type="text" id="version_history" name="version_history" class="form-control" placeholder="e.g., v1.0 / Initial Draft / Updated Version">
                    </div>
                  </div>

                  <!-- Reviewed By -->
                  <div class="col-md-3">
                    <div class="mb-3">
                      <label for="reviewed_by" class="form-label mb-1 fw-medium"> Reviewed By </label>
                      <select id="reviewed_by" name="reviewed_by" class="form-select">
                        <option value="">Select Reviewer</option>
                        <option value="Paralegal">Paralegal</option>
                        <option value="Lawyer">Lawyer</option>
                      </select>
                    </div>
                  </div>

                  <!-- Status -->
                  <div class="col-md-3">
                    <div class="mb-3">
                      <label for="status" class="form-label mb-1 fw-medium"> Status </label>
                      <select id="statuss" name="status" class="form-select">
                        <option value="">Select Status</option>
                        <option value="Draft">Draft</option>
                        <option value="Reviewed">Reviewed</option>
                        <option value="Approved">Approved</option>
                      </select>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
          <!-- card end -->

          <div class="d-flex align-items-center justify-content-end">
            <a href="legaldrafting-list.php" class="btn btn-light me-2">Cancel</a>
            <button type="submit" class="btn btn-primary btn-md fs-13 fw-medium rounded">Save Drafting</button>
          </div>

        </form>
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
    <?php include('footer.php'); ?>
<!-- Footer End -->
